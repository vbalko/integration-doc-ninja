const fs = require("fs").promises; // Use the promise-based version of fs
const path = require("path");
const AdmZip = require("adm-zip");
const xml2js = require("xml2js");
//import axios
const axios = require("axios");

require("dotenv").config();

const configuration = {
  tokenBuffer: "",
  baseUrl: process.env.BASE_URL || "",
  tokenUrl: process.env.TOKEN_URL || "",
  clientId: process.env.CLIENT_ID || "",
  clientSecret: process.env.CLIENT_SECRET || "",
};

// write json to file
module.exports.writeJsonToFile = async function (json, fileName) {
  await fs.writeFile(fileName, JSON.stringify(json, null, 2));
};

// write string to file
module.exports.writeStringToFile = async function (string, fileName) {
  await fs.writeFile(fileName, string);
};

//get base url
getBaseUrl = async function () {
  const baseUrl = configuration.baseUrl;
  return baseUrl;
};

//get api credentials
getAPICredentials = async function () {
  const clientId = configuration.clientId;;
  const clientSecret = configuration.clientSecret;
  return { clientId, clientSecret };
};

//download the zip file from sap api hub
module.exports.downloadZipFile = async function (iflowId, Version = "active") {
  //import id and secret from the environment variables
  const { clientId, clientSecret } = await getAPICredentials();

  const url = `${await getBaseUrl()}/IntegrationDesigntimeArtifacts(Id='${iflowId}',Version='${Version}')/$value`;

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
};

//get configuration parameters from api hub
module.exports.getConfigurationParameters = async function (
  iflowId,
  Version = "active"
) {
  //get credentials
  const { clientId, clientSecret } = await getAPICredentials();

  const url = `${await getBaseUrl()}/IntegrationDesigntimeArtifacts(Id='${iflowId}',Version='${Version}')/Configurations`;

  //get token
  const token = await getOAuthToken(clientId, clientSecret);

  //get the configuration parameters
  const configurationResponse = await axios.get(url, {
    headers: {
      Authorization: "Bearer " + token,
    },
  });
  return configurationResponse.data.d.results;
};

//get oauth token and use local buffer in order to avoid multiple calls
async function getOAuthToken(clientId, clientSecret) {
  //import axios
  const axios = require("axios");

  //if tokenBuffer is empty, get the token
  if (configuration.tokenBuffer === "") {
    //get oauth token
    const tokenResponse = await axios.post(
      configuration.tokenUrl,
      "client_id=" +
        clientId +
        "&client_secret=" +
        clientSecret +
        "&grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    //return the token
    return tokenResponse.data.access_token;
  } else {
    //get the token from the buffer
    return configuration.tokenBuffer;
  }
}
