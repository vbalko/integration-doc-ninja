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

  /**
   * Calls the SAP API with the provided options.
   * @param {Object} options - The options for the API call.
   * @param {string} options.url - The URL for the API call.
   * @param {string} [options.method='get'] - The HTTP method for the API call.
   * @param {Object} [options.data=null] - The data to send with the API call.
   * @param {string} [options.responseType='json'] - The response type for the API call.
   * @returns {Promise<Object>} - The response data from the API call.
   */
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
    
    //return the iflow data (zip file as arraybuffer)
    return response;
    // //write the zip file to the file system
    // await utils.writeDataToFile(response, `${iflowId}.zip`);
    // // await fs.writeFile(`${iflowId}.zip`, response.data);

    // //return if the zip file was downloaded
    // return true;
  }

  //get iflow which are called by the provided iflow (based on correlation id) - Simple Way
  async getIflowsByCorrelationIdSimple(iflowId) {
    //get last call of the iflow to get the correlation id
    const lastCall = await this.getMplRecords({
      filter: `IntegrationFlowName  eq '${iflowId}'`,
      orderby: "LogStart desc",
      top: 1,
    });
    //get the correlation id
    const correlationId = lastCall[0].CorrelationId;

    //get all calls of the iflow with the correlation id
    const calls = await this.getMplRecords({
      filter: `CorrelationId  eq '${correlationId}'`,
      orderby: "LogStart desc",
    });

    //get all iflows which are called by the provided iflow
    const iflows = [];
    for (const call of calls) {
      //only if IntegrationArtifact.Type is INTEGRAION_FLOW
      if (call.IntegrationArtifact.Type === "INTEGRATION_FLOW") {
        if (call.IntegrationArtifact.Id !== iflowId) {
          iflows.push({
            Id: call.IntegrationArtifact.Id,
            Name: call.IntegrationArtifact.Name,
            PackageId: call.IntegrationArtifact.PackageId,
            PackageName: call.IntegrationArtifact.PackageName,
          });
        }
      }
    }

    //remove duplicates based on Id
    const uniqueIflows = iflows.filter(
      (thing, index, self) =>
        index === self.findIndex((t) => t.Id === thing.Id)
    );

    //return the iflows
    return uniqueIflows;
  }

  //get MPL records from api hub
  async getMplRecords(parameters) {
    const {
      filter = "",
      orderby = "",
      skip = "",
      top = "",
      format = "json",
    } = parameters;
    // Build the parameters string for the request
    let params = "";
    if (filter) {
      params += `&$filter=${filter}`;
    }
    if (orderby) {
      params += `&$orderby=${orderby}`;
    }
    if (skip) {
      params += `&$skip=${skip}`;
    }
    if (top) {
      params += `&$top=${top}`;
    }
    if (format) {
      params += `&$format=${format}`;
    }
    if (params) {
      params = "?" + params.substring(1);
    }

    // Build the URL
    const url = `${await this.getBaseUrl()}/MessageProcessingLogs${params}`;

    //call the api
    const response = await this.callAPI({ url: url });

    //return the response
    return response.d.results;
  }
}

module.exports = SAPApidProcessing;
