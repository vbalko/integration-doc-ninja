require("dotenv").config();
//import axios
const axios = require("axios");
const utils = require("./utils.js");

const configuration = {
  tokenBuffer: "",
  configBuffer: "",
  baseUrl: process.env.BASE_URL || "",
  tokenUrl: process.env.TOKEN_URL || "",
  clientId: process.env.CLIENT_ID || "",
  clientSecret: process.env.CLIENT_SECRET || "",
};

class SAPApidProcessing {
  constructor() {}

  //get oauth token and use local buffer in order to avoid multiple calls
  async getOAuthToken(clientId = null, clientSecret = null) {
    //if client id and client secret are not provided, get them from the environment variables
    if (clientId === null || clientSecret === null) {
      //get credentials
      clientId = configuration.clientId;
      clientSecret = configuration.clientSecret;
    }
    const tokenUrl = configuration.tokenUrl;

    //if tokenBuffer is empty, get the token
    if (configuration.tokenBuffer === "") {
      //get oauth token
      const tokenResponse = await axios.post(
        tokenUrl,
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

  //get base url
  async getBaseUrl() {
    const baseUrl = configuration.baseUrl;
    return baseUrl;
  }

  //call api with oauth token
  async callAPI(options) {
    const { url, method = "get", data = null, responseType = "json" } = options;

    //get token
    const token = await this.getOAuthToken();

    //call the api
    const response = await axios({
      method,
      url,
      data,
      headers: {
        Authorization: "Bearer " + token,
      },
      responseType,
    });

    return response.data;
  }

  //get configuration parameters from api hub
  async getConfigurationParameters(iflowId, Version = "active") {
    const url = `${await this.getBaseUrl()}/IntegrationDesigntimeArtifacts(Id='${iflowId}',Version='${Version}')/Configurations`;

    //if configBuffer is empty, get the config
    if (configuration.configBuffer === "") {
      //call the api
      const response = await this.callAPI({ url: url });
      //save the response to the buffer
      configuration.configBuffer = response.d.results;
    }

    //return the config from the buffer
    return configuration.configBuffer;
  }

  //download the zip file from sap api hub
  async downloadZipFile(iflowId, Version = "active") {
    const url = `${await this.getBaseUrl()}/IntegrationDesigntimeArtifacts(Id='${iflowId}',Version='${Version}')/$value`;

    //call the api
    const response = await this.callAPI({
      url: url,
      responseType: "arraybuffer",
    });

    //write the zip file to the file system
    await utils.writeDataToFile(response, `${iflowId}.zip`);
    // await fs.writeFile(`${iflowId}.zip`, response.data);

    //return if the zip file was downloaded
    return true;
  }
}

module.exports = SAPApidProcessing;
