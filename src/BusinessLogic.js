const SapApi = require("./SapApiProcessing");
const ZipArchiveProcessing = require("./ZipArchiveProcessing");
const IFlowParser = require("./iflowParser");
const MermaidConverter = require("./BPMNtoMermaid");
const htmlOutput = require("./HTMLOutput");

const utils = require("./utils");

module.exports.processIflows = {
  //process integration process (all connected iflows)
  /**
   * Processes the integration process for the provided iFlow ID by creating a process flow for each connected iFlow.
   * @async
   * @param {Object} options - The options object.
   * @param {string} options.iflowId - The ID of the iFlow to process.
   * @param {string} [options.projectName=""] - The name of the project to create the process flow in. If not provided, the iFlow ID will be used.
   * @param {boolean} [options.forceDownload=true] - Whether to force download the zip file for each iFlow or use the existing one if available.
   */
  processIntegrationProcess: async (options) => {
    const {
      iflowId,
      forceDownload = true,
      projectName = options.iflowId,
    } = options;

    //create zip archive processing object
    const zip = new ZipArchiveProcessing();
    //get all the iflows connected to the provided iflow
    const sapApi = new SapApi();
    const iflows = await sapApi.getIflowsByCorrelationIdSimple(iflowId);

    const projectFolder = `output/${projectName}`;

    //prepare the project folder
    await utils.setupProjectFolder(projectFolder);

    //prepare folder for html output
    await utils.setupProjectFolder(`${projectFolder}/html`);

    //create html output object
    const html = new htmlOutput();

    const overviewDiagramData = [];

    /** LOOP OVER IFLOWS
    /*loop through all the iflows and create process flow for each iflow
    ********************************/
    for (const iflow of iflows) {
      /** PROCESS EACH IFLOW
       ********************************/
      const isZipFileDownloaded = await localUtils.prepareZipArchive({
        iflowId: iflow.Id,
        folderName: projectFolder,
        forceDownload,
      });
      if (isZipFileDownloaded) {
        /**
         * GET IFLOW FROM ZIP ARCHIVE
         *****************************/
        const { data, name } = await zip.getIflowFromZipArchive({
          zipData: isZipFileDownloaded.zipData,
          parseXML: true,
        });
        if (data) {
          /** PARSE IFLOW TO GET PROCESS ELEMENTS (JSON)
           * ********************************/
          console.log(`Current iFlow: ${name} `);
          const iFlowParser = new IFlowParser(data);
          iFlowParser.setIflowId(name);

          const processElements = await iFlowParser.parse();
          await utils.writeJsonToFile(
            processElements,
            `${name}.json`,
            projectFolder
          );

          //get process input/output information - this is used to create the overview diagram
          overviewDiagramData.push(await iFlowParser.getProcessInputOutput());

          /** PARSE PROCESS ELEMENTS TO CREATE PROCESS FLOW (MERMAID)
           * ********************************/
          const mermaidConverter = new MermaidConverter(processElements);
          const mermaidData = await mermaidConverter.createFlowchart();
          await utils.writeDataToFile(
            mermaidData,
            `${name}.mmd`,
            projectFolder
          );
          await utils.convertMMDToSVG(`${name}.mmd`, projectFolder);

          /** CREATE HTML OUTPUT
           * ********************************/
          //add the mermaid diagram to the html output
          html.setProjectName(projectName);
          html.addDiagram({ name, projectFolder, mermaidData });
        }
      } else {
        console.log(`Failed to download zip file for iFlow ${iflow}`);
      }
    }

    /** CREATE OVERVIEW DIAGRAM
     * ********************************/
    const mermaidConverter = new MermaidConverter({});
    const overviewDiagram = await mermaidConverter.createOverviewFlowchart(overviewDiagramData);
    await utils.writeDataToFile(
        overviewDiagram,
        `overviewFlowChart.mmd`,
        projectFolder
        );
    await utils.convertMMDToSVG(`overviewFlowChart.mmd`, projectFolder);
    //add the overview diagram to the html output
    html.addDiagram({ name: "overviewFlowChart", projectFolder, mermaidData: overviewDiagram });

    //write the html output to file
    console.log("Writing HTML output to file...");
    await utils.writeDataToFile(
      html.HTMLTemplateMermaid(),
      `${projectName}.mermaid.html`,
      `${projectFolder}/html`
    );
    await utils.writeDataToFile(
      html.HTMLTemplatePNG(),
      `${projectName}.png.html`,
      `${projectFolder}/html`
    );
    await utils.writeDataToFile(
      html.HTMLTemplateSVG(),
      `${projectName}.svg.html`,
      `${projectFolder}/html`
    );
  },
};

const localUtils = {
  /**
   * Prepares the zip archive for the provided iFlow ID by downloading it if necessary and saving it to the project folder.
   * @async
   * @param {Object} options - The options object.
   * @param {string} options.iflowId - The ID of the iFlow to prepare the zip archive for.
   * @param {string} options.folderName - The name of the project folder to save the zip archive in.
   * @param {boolean} [options.forceDownload=true] - Whether to force download the zip file or use the existing one if available.
   * @returns {boolean|Object} - Returns true if the zip file is already downloaded, false if it failed to download, or an object containing the zip data and file name if it was successfully downloaded.
   */
  prepareZipArchive: async (options) => {
    const { iflowId, folderName, forceDownload = true } = options;

    if (forceDownload) {
      //delete all the zip files in the project folder
      //await utils.deleteZipFiles(folderName);
      await utils.deleteFile(`${iflowId}.zip`, folderName);
    }
    //check if iflow zip file is downloaded
    const isZipFileDownloaded = await utils.zipFileDownloaded(
      iflowId,
      folderName
    );
    if (isZipFileDownloaded) {
      return true;
    } else {
      //log that zip is going to be downloaded
      console.log(
        `Downloading zip file for iFlow ${iflowId} into folder ${folderName}...`
      );
      //download the zip file
      const sapApi = new SapApi();
      const zipFileDownloaded = await sapApi.downloadZipFile(iflowId);
      if (zipFileDownloaded) {
        //save the zip file to the project folder
        await utils.writeDataToFile(
          zipFileDownloaded,
          `${iflowId}.zip`,
          folderName
        );
        return { zipData: zipFileDownloaded, zipFileName: `${iflowId}.zip` };
      } else {
        return false;
      }
    }
  },

  prepareOverviewDiagram: async (options) => {},
};
