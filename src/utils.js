const fs = require("fs").promises; // Use the promise-based version of fs
const path = require("path");
const SapApi = require("./SAPApiProcessing.js");

// write json to file
module.exports.writeJsonToFile = async function (json, fileName) {
  await fs.writeFile(fileName, JSON.stringify(json, null, 2));
};

module.exports.writeDataToFile = async function (data, fileName) {
  //write the zip file to the file system
  await fs.writeFile(fileName, data);
};

// write string to file
module.exports.writeStringToFile = async function (string, fileName) {
  await fs.writeFile(fileName, string);
};

//delete all zip files in the current directory
module.exports.deleteZipFiles = async function () {
  const files = await fs.readdir(".");
  for (const file of files) {
    if (path.extname(file) === ".zip") {
      await fs.unlink(file);
    }
  }
};

module.exports.getConfigurationParameters = async function (
  iflowId,
  Version = "active"
) {
  const sapApi = new SapApi();
  const configurationParameters = await sapApi.getConfigurationParameters(
    iflowId,
    Version
  );
  return configurationParameters;
};

//checks if the zip file is downloaded
module.exports.zipFileDownloaded = async function (iflowId) {
  const files = await fs.readdir(".");
  //checks if iflowId.zip is in the current directory
  const zipFile = files.find((file) => file === `${iflowId}.zip`);
  if (zipFile) {
    return true;
  } else {
    return false;
  }
};
