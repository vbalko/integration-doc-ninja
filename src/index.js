

const utils = require("./utils.js");
const IFlowParser = require("./iflowParser.js");
const ZipArchiveProcessing = require("./ZipArchiveProcessing.js");
const SapApi = require("./SAPApiProcessing.js");
const MermaidConverter = require("./BPMNtoMermaid.js");

//function to prepare zip archive
async function prepareZipArchive() {
  //get the iflow id from the command line
  const iflowId = process.argv[2] || 'Bamboo_AD_UserUpsert_PROD';
  if (!iflowId) {
    console.log("Please provide the iFlow ID as a command line argument.");
    return false;
  }
  //check if iflow zip file is downloaded
  const isZipFileDownloaded = await utils.zipFileDownloaded(iflowId);
  if (isZipFileDownloaded) {
    return true;
  } else {
    //log that zip is going to be downloaded
    console.log(`Downloading zip file for iFlow ${iflowId}...`);
    //download the zip file
    const sapApi = new SapApi();
    const isZipFileDownloaded = await sapApi.downloadZipFile(iflowId);
    if (isZipFileDownloaded) {
      return true;
    } else {
      return false;
    }
  }
}



// Main function to read the zip file and process the iFlow
async function main() {
  try {

    //delete all zip files in the current directory
    //await utils.deleteZipFiles();

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

      const processElements = await iFlowParser.parse();//await iFlowParser.getProcessElements(); 
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
