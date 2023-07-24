const fs = require("fs").promises; // Use the promise-based version of fs
const path = require("path");
const AdmZip = require("adm-zip");
const xml2js = require("xml2js");
  //import axios
  const axios = require("axios");

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

//download the zip file from sap api hub
module.exports.downloadZipFile = async function (iflowId, Version="active") {
  //import id and secret from the environment variables
  const clientId = process.env.CLIENT_ID || '';
  const clientSecret = process.env.CLIENT_SECRET || '';

  const url = `https://dra-pro-int-pw98ouif.it-cpi005-rt.cfapps.eu20.hana.ondemand.com/api/v1/IntegrationDesigntimeArtifacts(Id='${iflowId}',Version='${Version}')/$value`;

  //get oauth token
  const token = await getOAuthToken(clientId, clientSecret);



  //get the zip file
  const zipResponse = await axios.get(url, {
    headers: {
      Authorization: "Bearer " + token,
    },
    responseType: "arraybuffer",
  });

  //write the zip file to the file system
  await fs.writeFile("iflow.zip", zipResponse.data);

  //return if the zip file was downloaded
  return true;

}

//get oauth token
async function getOAuthToken(clientId, clientSecret) {
  //import axios
  const axios = require("axios");

  //get oauth token
  const tokenResponse = await axios.post(
    "https://dra-pro-int-pw98ouif.authentication.eu20.hana.ondemand.com/oauth/token",
    "client_id=" + clientId + "&client_secret=" + clientSecret + "&grant_type=client_credentials",
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  //return the token
  return tokenResponse.data.access_token;
}