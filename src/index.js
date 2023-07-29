// const utils = require("./utils.js");
// const IFlowParser = require("./iflowParser.js");
// const ZipArchiveProcessing = require("./ZipArchiveProcessing.js");
// const SapApi = require("./SAPApiProcessing.js");
// const MermaidConverter = require("./BPMNtoMermaid.js");
const businessLogic = require("./BusinessLogic.js");

//test get iflow by correlation id
async function testGetIflowsByCorrelationId() {
  const sapApi = new SapApi();
  const iflowId = "Bamboo_AD_UserUpsert_PROD";
  const iflows = await sapApi.getIflowsByCorrelationIdSimple(iflowId);
  console.log(iflows);
}

// Main function to read the zip file and process the iFlow
async function main() {
  try {
    //get two arguments from the command line
    // first is the iflow id and second is the project name
    // if not provided, write message how to use the script and exit
    const iflowId = process.argv[2];
    const projectName = process.argv[3];

    if (!iflowId || !projectName) {
      //if we are in debug mode, use the default values
      if (process.env.DEBUG) {
        iflowId = "Bamboo_AD_UserUpsert_PROD";
        projectName = "Bamboo AD Synchronization";
      } else {
        console.log(
          `Please provide the iFlow ID and project name as command line arguments.\n Example: node index.js Bamboo_AD_UserUpsert_PROD Bamboo AD Synchronization`
        );
        return false;
      }
    }

    // //get the iflow id from the command line
    // const iflowId = process.argv[2] || "Bamboo_AD_UserUpsert_PROD";
    // if (!iflowId) {
    //   console.log("Please provide the iFlow ID as a command line argument.");
    //   return false;
    // }

    await businessLogic.processIflows.processIntegrationProcess({
      iflowId: iflowId,
      projectName: projectName,
    });
    return;

    //prepare the zip archive
    const isZipFileDownloaded = await prepareZipArchive();
    if (!isZipFileDownloaded) {
      return false;
    }

    //create zip archive processing object
    const zip = new ZipArchiveProcessing();
    //read the zip file
    await zip.readZipFile();

    //get the iflow from the zip archive
    const { data, name } = await zip.getIflowFromZipArchive();

    if (data) {
      console.log(`Current iFlow: ${name} `);

      const iFlowParser = new IFlowParser(data);
      iFlowParser.setIflowId(name);

      const processElements = await iFlowParser.parse(); //await iFlowParser.getProcessElements();
      // const processElements = await iFlowParser.getProcessElements();
      // console.log("Process Elements in the first iFlow:");
      //write the process elements to the file
      await utils.writeJsonToFile(processElements, "processElements.json");

      //convert the process elements to mermaid
      const mermaidConverter = new MermaidConverter(processElements);
      const mermaidCode = mermaidConverter.createFlowchart();
      //const mermaidCode = mermaidConverter.convertToMermaid();
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
