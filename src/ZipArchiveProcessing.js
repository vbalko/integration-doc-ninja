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
  constructor(zipFile = null) {
    this.zipFile = zipFile;
  }

  // Function to read the zip file
  //export function for reading the zip file
  async readZipFile(name = null) {
    //if name is null, then find first zip file in the root folder
    if (name === null) {
      const files = await fs.readdir(".");
      const zipFile = files.find((file) => path.extname(file) === ".zip");
      if (zipFile) {
        name = zipFile;
      } else {
        console.log("No .zip file found in the root folder.");
      }
    }
    // Read the zip file from the filesystem
    const zip = new AdmZip(name);
    const zipEntries = zip.getEntries();
    this.zipFile = zipEntries;
  }

  //get iflow from zip archive
  async getIflowFromZipArchive() {
    // Find the iFlow files (BPMN XMLs)
    const iFlowEntries = this.zipFile.filter((entry) =>
      this.isIFlowEntry(entry.entryName)
    );

    if (iFlowEntries.length > 0) {
      // Get the first iFlow file
      const iFlowEntry = iFlowEntries[0];
      // Get the content of the iFlow file
      const bpmnXML = iFlowEntry.getData().toString("utf8");
      // Parse the BPMN XML
      const bpmnJSON = await this.parseBpmnXML(bpmnXML);

      //get iflow name from manifest
      const iflowName = await this.getIflowNameFromManifest();

      return { data: bpmnJSON, name: iflowName };
    }
  }

  //parse manifest.mf file
  parseManifest(manifest) {
    const manifestLines = manifest.trim().split("\n");
    const manifestObject = {};
    manifestLines.forEach((line) => {
      const [key, value] = line.split(":");
      manifestObject[key] = value?.trim();
    });
    return manifestObject;
  }

  //get manifest from zip archive
  async getManifestFromZipArchive() {
    // Find the manifest file
    const manifestEntry = this.zipFile.find((entry) => {
      return entry.entryName === paths.manifest;
    });
    if (manifestEntry) {
      //parse the manifest file
      const manifest = this.parseManifest(
        manifestEntry.getData().toString("utf8")
      );
      return manifest;
    }
    return null;
  }

  //get iflow name from manifest
  async getIflowNameFromManifest() {
    const manifest = await this.getManifestFromZipArchive();
    if (manifest) {
      return manifest["Bundle-Name"];
    }
    return null;
  }

  // Function to check if an entry is an iFlow file
  isIFlowEntry(entryName) {
    return (
      entryName.startsWith(
        "src/main/resources/scenarioflows/integrationflow/"
      ) && entryName.endsWith(".iflw")
    );
  }

  // Function to parse BPMN XML
  async parseBpmnXML(bpmnXML) {
    const parser = new xml2js.Parser({
        explicitArray: false,
        explicitChildren: false,
        mergeAttrs: true,
        xmlns: true,
        xmlnsPrefix: "bpmn2",
        });
        const ret = parser.parseStringPromise(bpmnXML);
        return ret;
  
    // const ret = xml2js.parseString(
    //   bpmnXML,
    //   {
    //     explicitArray: false,
    //     explicitChildren: false,
    //     mergeAttrs: true,
    //     xmlns: true,
    //     xmlnsPrefix: "bpmn2",
    //   },
    //   (err, result) => {
    //     if (err) {
    //       reject(err);
    //     } else {
    //       resolve(result);
    //     }
    //   }
    // );
    // return ret;
  }
}

module.exports = ZipArchiveProcessing;
