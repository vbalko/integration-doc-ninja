

const utils = require("./utils.js");
const IFlowParser = require("./iflowParser.js");
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
    await utils.downloadZipFile("Bamboo_AD_UserUpsert_PROD", "active");
    // Read the zip file from the filesystem
    const zipEntries = await utils.readZipFile();
    // Find the iFlow files (BPMN XMLs)
    const iFlowEntries = zipEntries.filter((entry) =>
      utils.isIFlowEntry(entry.entryName)
    );

    if (iFlowEntries.length > 0) {
      // Get the first iFlow file
      const iFlowEntry = iFlowEntries[0];

      // Get the content of the iFlow file
      const bpmnXML = iFlowEntry.getData().toString("utf8");

      // Parse the BPMN XML
      const parsedXML = await utils.parseBpmnXML(bpmnXML);

      // List all available iFlows and process elements
      console.log("Available iFlows:");
      console.log(iFlowEntries.map((entry) => entry.entryName));

      const iFlowParser = new IFlowParser(parsedXML);

      const processElements = iFlowParser.getProcessElements(); //listProcessElements(parsedXML);
      console.log("Process Elements in the first iFlow:");
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
