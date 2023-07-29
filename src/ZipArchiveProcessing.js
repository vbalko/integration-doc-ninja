const fs = require("fs").promises;
const path = require("path");

//class ZipArchiveProcessing which will be used to process the zip archive
// get iflow from zip archive
// also get iflow name and other information

const AdmZip = require("adm-zip");
const xml2js = require("xml2js");

const paths = {
  iflow: "src/main/resources/scenarioflows/integrationflow/",
  manifest: "META-INF/MANIFEST.MF",
};

class ZipArchiveProcessing {
  constructor() {
    this.zipFile = null;
  }

  // // Function to read the zip file
  // //export function for reading the zip file
  // async readZipFile(name = null) {
  //   //if name is null, then find first zip file in the root folder
  //   if (name === null) {
  //     const files = await fs.readdir(".");
  //     const zipFile = files.find((file) => path.extname(file) === ".zip");
  //     if (zipFile) {
  //       name = zipFile;
  //     } else {
  //       console.log("No .zip file found in the root folder.");
  //     }
  //   }
  //   // Read the zip file from the filesystem
  //   const zip = new AdmZip(name);
  //   const zipEntries = zip.getEntries();
  //   this.zipFile = zipEntries;
  // }

  /**
   * Finds and reads a zip file from a specified folder and returns its entries.
   * @param {string} fileName - The name of the zip file to find and read.
   * @param {string} folderName - The name of the folder to search for the zip file.
   * @param {boolean} setZipEntries - Whether to set the zip entries after reading the zip file. Default is true.
   * @returns {Promise<Array>|Promise<string>|Promise<null>} - An array of zip entries if setZipEntries is true, the path of the zip file if setZipEntries is false, or null if the zip file is not found.
   */
  async getZipFileFromFolder(fileName, folderName, setZipEntries = true) {
    const files = await fs.readdir(folderName);
    //check if filenName has .zip extension, if not, add it
    if (!fileName.endsWith(".zip")) {
      fileName = `${fileName}.zip`;
    }
    //find the zip file in the folder
    const zipFile = files.find(
      (file) => path.basename(file) === `${fileName}}`
    );
    if (zipFile) {
      if (setZipEntries) {
        const zipEntries = await this.getZipEntriesFromData(zipFile);
        return zipEntries;
      }
      return zipFile;
    }
    return null;
  }

  /**
   * Reads the zip data and returns the zip entries.
   * @param {Buffer} zipData - The zip data to read.
   * @returns {Array} - An array of zip entries.
   */
  async getZipEntriesFromData(zipData) {
    const zip = new AdmZip(zipData);
    const zipEntries = zip.getEntries();
    this.zipFile = zipEntries;
    return zipEntries;
  }

  //get iflow from zip archive
/**
 * Finds and returns the first iFlow file (BPMN XML) from the zip archive.
 * @param {Object} options - The options for getting the iFlow file.
 * @param {boolean} options.parseXML - Whether to parse the BPMN XML. Default is true.
 * @param {Buffer} options.zipData - The zip data to search for the iFlow file. If null, uses this.zipFile.
 * @returns {Promise<Object>|Promise<Array>} - An object containing the parsed BPMN XML and the iFlow name if parseXML is true, or an array of iFlow entries if parseXML is false. Returns null if no iFlow files are found.
 */
  async getIflowFromZipArchive(options = {}) {
    const { parseXML = true } = options;
    let { zipData = null } = options;
    //if zipData is null, then get data from this.zipFile
    if (zipData === null) {
      zipData = this.zipFile;
    } else {
      zipData = await this.getZipEntriesFromData(zipData);
    }
    // Find the iFlow files (BPMN XMLs)
    const iFlowEntries = zipData.filter((entry) =>
      localUtils.isIFlowEntry(entry.entryName)
    );

    if (iFlowEntries.length > 0) {
      if (!parseXML) {
        return iFlowEntries;
      }
      // Get the first iFlow file
      const iFlowEntry = iFlowEntries[0];
      // Get the content of the iFlow file
      const bpmnXML = iFlowEntry.getData().toString("utf8");
      // Parse the BPMN XML
      const bpmnJSON = await this.parseXML(bpmnXML);
      //get iflow name from manifest
      const iflowName = await localUtils.getIflowNameFromManifest(this.zipFile);

      return { data: bpmnJSON, name: iflowName };
    }
  }

  async parseXML(bpmnXML) {
    // const bpmnXML = iFlowEntry.getData().toString("utf8");
    // Parse the BPMN XML
    const bpmnJSON = await localUtils.parseBpmnXML(bpmnXML);
    return bpmnJSON;
  }
}

module.exports = ZipArchiveProcessing;

const localUtils = {
  parseBpmnXML: async (bpmnXML) => {
    const parser = new xml2js.Parser({
      explicitArray: false,
      explicitChildren: false,
      mergeAttrs: true,
      xmlns: true,
      xmlnsPrefix: "bpmn2",
    });
    const ret = parser.parseStringPromise(bpmnXML);
    return ret;
  },
  parseManifest: (manifest) => {
    const manifestLines = manifest.trim().split("\n");
    const manifestObject = {};
    manifestLines.forEach((line) => {
      const [key, value] = line.split(":");
      manifestObject[key] = value?.trim();
    });
    return manifestObject;
  },
  getManifestFromZipArchive: (zipFile) => {
    // Find the manifest file
    const manifestEntry = zipFile.find((entry) => {
      return entry.entryName === paths.manifest;
    });
    if (manifestEntry) {
      //parse the manifest file
      const manifest = localUtils.parseManifest(
        manifestEntry.getData().toString("utf8")
      );
      return manifest;
    }
    return null;
  },

  //get iflow name from manifest
  getIflowNameFromManifest: (zipFile) => {
    const manifest = localUtils.getManifestFromZipArchive(zipFile);
    if (manifest) {
      return manifest["Bundle-Name"];
    }
    return null;
  },
  // Function to check if an entry is an iFlow file
  isIFlowEntry: (entryName) => {
    return (
      entryName.startsWith(
        "src/main/resources/scenarioflows/integrationflow/"
      ) && entryName.endsWith(".iflw")
    );
  }
};
