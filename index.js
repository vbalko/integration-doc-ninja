const fs = require('fs').promises; // Use the promise-based version of fs
const path = require('path');
const xml2js = require('xml2js');
const AdmZip = require('adm-zip');

// Function to check if an entry is an iFlow file
function isIFlowEntry(entryName) {
  return entryName.startsWith('src/main/resources/scenarioflows/integrationflow/') &&
         entryName.endsWith('.iflw');
}

// Function to parse BPMN XML and return a promise
function parseBpmnXML(bpmnXML) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(bpmnXML, {
      explicitArray: false,
      explicitChildren: false,
      mergeAttrs: true,
      xmlns: true,
      xmlnsPrefix: 'bpmn2'
    }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// Function to extract basic data from a BPMN element
function extractBasicData(bpmnElement) {
  const basicData = {};

  // Get the element ID from the 'id' property
  if (bpmnElement['@_id']) {
    basicData.id = bpmnElement['@_id'];
  }

  // Get the element name from the 'name' property
  if (bpmnElement.name && bpmnElement.name['_text']) {
    basicData.name = bpmnElement.name['_text'];
  }

  // Add more properties as needed, e.g., type, description, etc.

  return basicData;
}

// Function to list all process elements from a parsed BPMN XML
function listProcessElements(parsedXML) {
  const processElements = [];

  // Get all process elements from the parsed XML
  const processes = parsedXML['bpmn2:definitions']?.['bpmn2:process'];
  if (processes) {
    const processArray = Array.isArray(processes) ? processes : [processes];
    for (const process of processArray) {
      const tasks = process['bpmn2:task'] || [];
      const gateways = process['bpmn2:exclusiveGateway'] ? [process['bpmn2:exclusiveGateway']] : [];
      const events = process['bpmn2:event'] || [];

      // Extract basic data for each task
      for (const task of tasks) {
        const basicData = extractBasicData(task);
        basicData.type = 'Task'; // Add the type of element
        processElements.push(basicData);
      }

      // Extract basic data for each gateway
      for (const gateway of gateways) {
        const basicData = extractBasicData(gateway);
        basicData.type = 'Gateway'; // Add the type of element
        processElements.push(basicData);
      }

      // Extract basic data for each event
      for (const event of events) {
        const basicData = extractBasicData(event);
        basicData.type = 'Event'; // Add the type of element
        processElements.push(basicData);
      }
    }
  }

  return processElements;
}

// Main function to read the zip file and process the iFlow
async function main() {
  try {
    const files = await fs.readdir('.');
    const zipFile = files.find((file) => path.extname(file) === '.zip');

    if (zipFile) {
      // Read the zip file from the filesystem
      const zip = new AdmZip(zipFile);
      const zipEntries = zip.getEntries();

      // Find the iFlow files (BPMN XMLs)
      const iFlowEntries = zipEntries.filter((entry) => isIFlowEntry(entry.entryName));

      if (iFlowEntries.length > 0) {
        // Get the first iFlow file
        const iFlowEntry = iFlowEntries[0];

        // Get the content of the iFlow file
        const bpmnXML = iFlowEntry.getData().toString('utf8');

        // Parse the BPMN XML
        const parsedXML = await parseBpmnXML(bpmnXML);

        // List all available iFlows and process elements
        console.log('Available iFlows:');
        console.log(iFlowEntries.map((entry) => entry.entryName));

        const processElements = listProcessElements(parsedXML);
        console.log('Process Elements in the first iFlow:');
        console.log(processElements);
      } else {
        console.log('No iFlow (BPMN XML) files found in the zip.');
      }
    } else {
      console.log('No .zip file found in the root folder.');
    }
  } catch (err) {
    console.error(err);
  }
}

// Call the main function
main();
