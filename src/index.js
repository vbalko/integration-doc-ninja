

const utils = require("./utils.js");
const IFlowParser = require("./iflowParser.js");
const ZipArchiveProcessing = require("./ZipArchiveProcessing.js");
const MermaidConverter = require("./BPMNtoMermaid.js");




// // Function to extract basic data from a BPMN element
// function extractBasicData(bpmnElement) {
//   const basicData = {};

//   // Get the element ID from the 'id' property
//   if (bpmnElement["id"]) {
//     basicData.id = bpmnElement.id.value;
//   }

//   // Get the element name from the 'name' property
//   if (bpmnElement.name && bpmnElement.name["value"]) {
//     basicData.name = bpmnElement.name["value"];
//   }

//   // Add more properties as needed, e.g., type, description, etc.

//   return basicData;
// }

// Function to list all process elements from a parsed BPMN XML
function listProcessElements(parsedXML) {
  const processElements = {};

  // Get all process elements from the parsed XML
  const processes = parsedXML["bpmn2:definitions"]?.["bpmn2:process"];
  if (processes) {
    const processArray = Array.isArray(processes) ? processes : [processes];
    for (const process of processArray) {
      const tasks = process["bpmn2:task"] || [];
      const gateways = process["bpmn2:exclusiveGateway"]
        ? [process["bpmn2:exclusiveGateway"]]
        : [];
      const events = process["bpmn2:event"] || [];

      const processBasicData = extractBasicData(process);
      processBasicData.tasks = [];
      processBasicData.gateways = [];
      processBasicData.events = [];

      // Extract basic data for each task
      for (const task of tasks) {
        const basicData = extractBasicData(task);
        basicData.type = "Task"; // Add the type of element
        processBasicData.tasks.push(basicData);
      }

      // Extract basic data for each gateway
      for (const gateway of gateways) {
        const basicData = extractBasicData(gateway);
        basicData.type = "Gateway"; // Add the type of element
        processBasicData.gateways.push(basicData);
      }

      // Extract basic data for each event
      for (const event of events) {
        const basicData = extractBasicData(event);
        basicData.type = "Event"; // Add the type of element
        processBasicData.events.push(basicData);
      }

      processElements[processBasicData.id] = {
        name: processBasicData.name,
        processInfo: processBasicData,
      };
    }
  }

  return processElements;
}

// Main function to read the zip file and process the iFlow
async function main() {
  try {
    //download the zip file from sap api hub
    // await utils.downloadZipFile("Bamboo_AD_UserUpsert_PROD", "active");

    //create zip archive processing object
    const zip = new ZipArchiveProcessing();
    //read the zip file
    await zip.readZipFile("iflow.zip");

    //get the iflow from the zip archive
    const { data, name } = await zip.getIflowFromZipArchive();


    if (data) {
      console.log(`Current iFlow: ${name} `);

      const iFlowParser = new IFlowParser(data);
      iFlowParser.setIflowId(name);

      const processElements = await iFlowParser.getProcessElements(); //listProcessElements(parsedXML);
      // console.log("Process Elements in the first iFlow:");
      //write the process elements to the file
        await utils.writeJsonToFile(processElements, "processElements.json");

        //convert the process elements to mermaid
        const mermaidConverter = new MermaidConverter(processElements);
        const mermaidCode = mermaidConverter.convertToMermaid();
        //write the mermaid code to the file
        await utils.writeStringToFile(mermaidCode, "mermaidCode.mmd");
    } else {
      console.log("No iFlow (BPMN XML) files found in the zip.");
    }
  } catch (err) {
    console.error(err);
  }
}

//export the main function
module.exports = main;
