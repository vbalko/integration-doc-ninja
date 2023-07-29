const fs = require("fs").promises; // Use the promise-based version of fs
const path = require("path");
const SapApi = require("./SAPApiProcessing.js");
//const cli = require("@mermaid-js/mermaid-cli");

// write json to file
/**
 * Writes a JSON object to a file.
 * @param {Object} json - The JSON object to write to the file.
 * @param {string} fileName - The name of the file to write the JSON object to.
 * @returns {Promise<void>} - A Promise that resolves when the JSON object has been written to the file.
 */

module.exports.writeJsonToFile = async function (json, fileName, folderName) {
  try {
    await fs.access(folderName);
    //write the json object to the ${folderName} directory
    await fs.writeFile(`${folderName}/${fileName}`, JSON.stringify(json, null, 2));
  } catch (error) {
    console.error(`Error writing JSON to file: ${error}`);
  }
};

module.exports.writeDataToFile = async function (data, fileName, folderName) {
  try {
    await fs.access(folderName);
    //write the zip file to the file system to the ${folderName} directory
    await fs.writeFile(`${folderName}/${fileName}`, data);
    // await fs.writeFile(fileName, data);
  } catch (error) {
    console.error(`Error writing data to file: ${error}`);
  }
};

// write string to file
module.exports.writeStringToFile = async function (string, fileName) {
  await fs.writeFile(fileName, string);
};

module.exports.convertMMDToSVG = async function (fileName, folderName) {
  const { run } = await import("@mermaid-js/mermaid-cli");
  await run(
    `${folderName}/${fileName}`,
    `${folderName}/html/${fileName}.svg`
  );
  await run(
    `${folderName}/${fileName}`,
    `${folderName}/html/${fileName}.png`
  );  
}

//delete all zip files in the folderName directory
module.exports.deleteZipFiles = async function (folderName) {
  try {
    await fs.access(folderName);
    const files = await fs.readdir(folderName);
    for (const file of files) {
      if (path.extname(file) === ".zip") {
        await fs.unlink(`${folderName}/${file}`);
      }
    }
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return true;
    } else {
      console.error(`Error deleting zip files: ${error}`);
      throw error;
    }
  }
};

module.exports.deleteFile = async function (fileName, folderName) {
  try {
    await fs.access(folderName);
    //delete the file in the ${folderName} directory
    await fs.unlink(`${folderName}/${fileName}`);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return true;
    } else {
      console.error(`Error deleting file: ${error}`);
      throw error;
    }
  }
};

//setup folder directory for the project
module.exports.setupProjectFolder = async function (folderName) {
  const folders = folderName.split("/");
  let currentPath = "";
  for (const folder of folders) {
    currentPath = path.join(currentPath, folder);
    try {
      await fs.access(currentPath);
    } catch (error) {
      if (error.code === "ENOENT") {
        await fs.mkdir(currentPath);
      } else {
        console.error(`Error setting up project folder: ${error}`);
        throw error;
      }
    }
  }
  // try {
  //   await fs.access(folderName);
  //   return true;
  // } catch (error) {
  //   if (error.code === "ENOENT") {
  //     await fs.mkdir(folderName);
  //     return true;
  //   } else {
  //     console.error(`Error setting up project folder: ${error}`);
  //     throw error;
  //   }
  // }
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
module.exports.zipFileDownloaded = async function (iflowId, folderName) {
  //look for the zip file in the ${folderName} directory
  const files = await fs.readdir(folderName);
  //checks if ${iflowId}.zip is in the current directory
  const zipFile = files.find((file) => file === `${iflowId}.zip`);
  if (zipFile) {
    return true;
  } else {
    return false;
  }
};
