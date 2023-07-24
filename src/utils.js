const fs = require("fs").promises; // Use the promise-based version of fs
const path = require("path");
const AdmZip = require("adm-zip");
const xml2js = require("xml2js");

//export function for reading the zip file
module.exports.readZipFile = async function() {
  const files = await fs.readdir(".");
  const zipFile = files.find((file) => path.extname(file) === ".zip");

  if (zipFile) {
    // Read the zip file from the filesystem
    const zip = new AdmZip(zipFile);
    const zipEntries = zip.getEntries();
    return zipEntries;
  } else {
    console.log("No .zip file found in the root folder.");
  }
};

// Function to check if an entry is an iFlow file
module.exports.isIFlowEntry = function(entryName) {
    return (
      entryName.startsWith("src/main/resources/scenarioflows/integrationflow/") &&
      entryName.endsWith(".iflw")
    );
  }
  
  // Function to parse BPMN XML and return a promise
module.exports.parseBpmnXML = function(bpmnXML) {
    return new Promise((resolve, reject) => {
      xml2js.parseString(
        bpmnXML,
        {
          explicitArray: false,
          explicitChildren: false,
          mergeAttrs: true,
          xmlns: true,
          xmlnsPrefix: "bpmn2",
        },
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  }

  // write json to file
module.exports.writeJsonToFile = async function (json, fileName) {
    await fs.writeFile(fileName, JSON.stringify(json, null, 2));
}

// write string to file
module.exports.writeStringToFile = async function (string, fileName) {
    await fs.writeFile(fileName, string);
}
