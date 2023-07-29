const utils = require("./utils.js");

//class for parsing the iflow xml which is standard bpmn 2.0 xml format with extensions for iflow
const attributePaths = {
  id: ["id", "value"],
  name: ["name", "value"],
};

const elementNames = {
  definitions: { id: "bpmn2:definitions", children: ["bpmn2:process"] },
  process: {
    id: "bpmn2:process",
    children: [
      "startEvent",
      "endEvent",
      "exclusiveGateway",
      "serviceTask",
      "participant",
      "callActivity",
    ],
  },
  startEvent: { id: "bpmn2:startEvent", children: [] },
  endEvent: { id: "bpmn2:endEvent", children: [] },
  exclusiveGateway: { id: "bpmn2:exclusiveGateway", children: [] },
  //   subProcess: {id:"bpmn2:subProcess",children:[]},
  serviceTask: { id: "bpmn2:serviceTask", children: [] },
  participant: { id: "bpmn2:participant", children: [] },
  callActivity: { id: "bpmn2:callActivity", children: [], type: "" },
};

const exceptionSubProcess = {
  id: "bpmn2:subProcess",
  children: [
    "startEvent",
    "endEvent",
    "exclusiveGateway",
    "serviceTask",
    "participant",
    "callActivity",
  ],
};

class IFlowParser {
  constructor(xmlData) {
    this.xmlData = xmlData;
    this.configurationParameters = {};
    this.iflowId = "";
    this.parsedData = {};
  }

  //set the iflow id
  setIflowId(iflowId) {
    this.iflowId = iflowId;
  }

  /**
   * Returns an object containing the iflow ID, sender and receiver message flows.
   * If the parsed data is not available, returns false.
   * @returns {Object|boolean} An object containing the iflow ID, sender and receiver message flows, or false if the parsed data is not available.
   */
  async getProcessInputOutput() {
    //check if we have already parsed the data, if not - return false
    if (Object.keys(this.parsedData).length === 0) {
      return false;
    }
    //find message flow with direction "Sender"
    const sender = this.parsedData["messageFlows"].filter(
      (messageFlow) => messageFlow["direction"] === "Sender"
    );
    //find message flow with direction "Receiver"
    const receiver = this.parsedData["messageFlows"].filter(
      (messageFlow) => messageFlow["direction"] === "Receiver"
    );
    return {
      iflowId: this.iflowId,
      sender: sender,
      receiver: receiver,
    }
  }

  //parse the iflow xml
  async parse() {
    try {
      await this.parseProcesses(this.xmlData);
      await this.parseParticipants(this.xmlData);
      await this.parseMessageFlows(this.xmlData);
      return this.parsedData;
    } catch (error) {
      console.log(`Error parsing iflow: ${error}`);
    }
  }

  //get the configuration parameters - read them from api if not already read
  async getConfigurationParameters(Version = "active") {
    //if the configuration parameters are not already read, then read them from api hub
    if (Object.keys(this.configurationParameters).length === 0) {
      //get the configuration parameters
      this.configurationParameters = await utils.getConfigurationParameters(
        this.iflowId,
        Version
      );
    }
    return this.configurationParameters;
  }

  //get configuration parameter by name
  async getConfigurationParameterByName(parameterName, Version = "active") {
    //get the configuration parameters
    const configurationParameters = await this.getConfigurationParameters(
      Version
    );
    //get the parameter
    const parameter = configurationParameters.filter(
      (parameter) => parameter["ParameterKey"] === parameterName
    );
    if (parameter.length > 0) {
      return parameter[0]["ParameterValue"];
    } else {
      return "";
    }
  }

  //set the xml data
  setXmlData(xmlData) {
    this.xmlData = xmlData;
  }

  //parse the processes from the xml
  async parseProcesses(inputXML) {
    const processesData =
      inputXML[elementNames.definitions.id]?.[
        elementNames.definitions.children[0]
      ];
    this.parsedData.processes = [];
    if (processesData) {
      const processArray = Array.isArray(processesData)
        ? processesData
        : [processesData];
      const processes = processArray.map((process) => {
        return this.parseProcess(process);
        //this.parsedData.processes.push(this.parseProcess(process));
      });
      this.parsedData.processes = processes;
    } else {
      //TODO: handle error
    }
  }

  //parse the participants from the xml
  async parseParticipants(inputXML) {
    const participantsData =
      inputXML[elementNames.definitions.id]?.["bpmn2:collaboration"]?.[
        "bpmn2:participant"
      ];
    this.parsedData.participants = [];
    if (participantsData) {
      const participantArray = Array.isArray(participantsData)
        ? participantsData
        : [participantsData];
      const participants = participantArray.map((participant) => {
        return this.parseParticipant(participant);
      });
      this.parsedData.participants = participants;
    } else {
      //TODO: handle error
    }
  }

  //parse the message flows from the xml
async parseMessageFlows(inputXML) {
    const messageFlowsData =
        inputXML[elementNames.definitions.id]?.["bpmn2:collaboration"]?.[
            "bpmn2:messageFlow"
        ];
    this.parsedData.messageFlows = [];
    if (messageFlowsData) {
        const messageFlowArray = Array.isArray(messageFlowsData)
            ? messageFlowsData
            : [messageFlowsData];
        const messageFlows = await Promise.all(messageFlowArray.map(async (messageFlow) => {
            return await this.parseMessageFlow(messageFlow);
        }));
        this.parsedData.messageFlows = messageFlows;
    } else {
        //TODO: handle error
    }
}

  //parse a process from the xml
  parseProcess(process) {
    const processBasicData = localUtils.extractBasicData(process);
    for (const child of elementNames.process.children) {
      const childElements = this.getElementsByType(process, child);
      processBasicData[child] = childElements;
    }
    //process sequence flows of this process
    const sequenceFlows = this.getSequenceFlows(process);
    processBasicData["sequenceFlows"] = sequenceFlows;
    //process sub processes of this process
    const subProcesses = this.getSubProcesses(process);
    processBasicData["subProcesses"] = subProcesses;

    return processBasicData;
  }

  //parse a participant from the xml
  parseParticipant(participant) {
    return {
      id: participant.id?.value || "",
      name: participant.name?.value || "",
      iflType: participant["ifl:type"]?.value || "",
    };
  }

  //parse a message flow from the xml
  async parseMessageFlow(messageFlow) {
    const ret = {
      id: messageFlow.id?.value || "",
      name: messageFlow.name?.value || "",
      type: "bpmn2:messageFlow",
      sourceRef: messageFlow.sourceRef?.value || "",
      targetRef: messageFlow.targetRef?.value || "",
      direction: await localUtils.getPropertyByName(messageFlow, "direction"),
    };
    const address = await localUtils.getMessageFlowAddress(
      this,
      ret.name,
      messageFlow
    );
    ret.addressRef = address.addressRef;
    ret.addressResolved = address.addressResolved;
    return ret;
  }

  //parse subprocesses from the xml
  parseSubProcess(process) {
    const processBasicData = localUtils.extractBasicData(process);
    const type = localUtils.getPropertyActivityType(process);
    if (type === "ErrorEventSubProcessTemplate") {
      for (const child of exceptionSubProcess.children) {
        const childElements = this.getElementsByType(process, child);
        processBasicData[child] = childElements;
      }
    } else {
      for (const child of elementNames.process.children) {
        const childElements = this.getElementsByType(process, child);
        processBasicData[child] = childElements;
      }
    }
    const sequenceFlows = this.getSequenceFlows(process);
    processBasicData["sequenceFlows"] = sequenceFlows;
    return processBasicData;
  }

  //get basic participant data
  getBasicParticipantData(bpmnElement) {
    const basicData = {};

    basicData.id = bpmnElement["id"].value;
    basicData.name = bpmnElement["name"].value;
    basicData.iflType = bpmnElement["ifl:type"].value;

    return basicData;
  }

  //get participant elements
  getParticipantElements(inputXML) {
    const participants = [];
    const participantsRecords = inputXML["bpmn2:participant"];
    if (participantsRecords) {
      const participantArray = Array.isArray(participantsRecords)
        ? participantsRecords
        : [participantsRecords];
      for (const participant of participantArray) {
        const basicData = this.getBasicParticipantData(participant);
        basicData.type = "bpmn2:participant"; // Add the type of element
        participants.push(basicData);
      }
      return participants;
    } else {
      return [];
    }
  }

  //get message flows
  async getMessageFlows(inputXML) {
    const messageFlows = [];
    const messageFlowsRecords = inputXML["bpmn2:messageFlow"];
    if (messageFlowsRecords) {
      const messageFlowArray = Array.isArray(messageFlowsRecords)
        ? messageFlowsRecords
        : [messageFlowsRecords];
      for (const messageFlow of messageFlowArray) {
        const basicData = {};
        basicData.id = messageFlow["id"].value;
        basicData.name = messageFlow["name"]?.value || "";
        basicData.sourceRef = messageFlow["sourceRef"].value;
        basicData.targetRef = messageFlow["targetRef"].value;
        basicData.type = "bpmn2:messageFlow"; // Add the type of element
        //remove {{ and }} from the parameter
        // basicData.addressRef = this.getPropertyByName(messageFlow, "address").replace("{{", "").replace("}}", "");
        // basicData.addressResolved = await this.getConfigurationParameterByName(basicData.addressRef);
        const address = await localUtils.getMessageFlowAddress(
          this,
          basicData.name,
          messageFlow
        );
        basicData.addressRef = address.addressRef;
        basicData.addressResolved = address.addressResolved;
        messageFlows.push(basicData);
      }
      return messageFlows;
    } else {
      return [];
    }
  }

  //get elemnents by type
  getElementsByType(inputXML, type) {
    const elements = [];
    const typeRecord = elementNames[type];
    const elementsOfType = inputXML[typeRecord.id];
    if (elementsOfType) {
      const elementArray = Array.isArray(elementsOfType)
        ? elementsOfType
        : [elementsOfType];
      for (const element of elementArray) {
        const basicData = localUtils.extractBasicData(element);
        basicData.type = typeRecord.id; // Add the type of element
        elements.push(basicData);
      }
    }
    return elements;
  }

  //get sequence flows
  getSequenceFlows(inputXML) {
    const sequenceFlowData = (data) => {
      return {
        id: data.id.value,
        name: data["name"]?.value || "",
        sourceRef: data.sourceRef.value || "",
        targetRef: data.targetRef.value || "",
        //if the condition expression is not empty then add it
        conditionExpression: data.conditionExpression
          ? data.conditionExpression["bpmn2:conditionExpression"]["#text"]
          : "",
      };
    };
    const sequenceFlows = [];
    const sequenceFlowsRecords = inputXML["bpmn2:sequenceFlow"];
    if (sequenceFlowsRecords) {
      const sequenceFlowArray = Array.isArray(sequenceFlowsRecords)
        ? sequenceFlowsRecords
        : [sequenceFlowsRecords];
      for (const sequenceFlow of sequenceFlowArray) {
        const basicData = sequenceFlowData(sequenceFlow);
        basicData.type = "bpmn2:sequenceFlow"; // Add the type of element
        sequenceFlows.push(basicData);
      }
      return sequenceFlows;
    } else {
      return [];
    }
  }

  //get subprocesses
  getSubProcesses(inputXML) {
    const subProcesses = [];
    const subProcessesRecords = inputXML["bpmn2:subProcess"];
    if (subProcessesRecords) {
      const subProcessArray = Array.isArray(subProcessesRecords)
        ? subProcessesRecords
        : [subProcessesRecords];
      for (const subProcess of subProcessArray) {
        const basicData = localUtils.extractBasicData(subProcess);
        basicData.type = "bpmn2:subProcess"; // Add the type of element

        //get subprocess activity type
        const type = localUtils.getPropertyActivityType(subProcess);

        //if activity type is exception then get the elements from the exception subprocess
        if (type === "ErrorEventSubProcessTemplate") {
          for (const child of exceptionSubProcess.children) {
            const childElements = this.getElementsByType(subProcess, child);
            basicData[child] = childElements;
          }
        } else {
          //get child elements loop through the children and get the elements
          for (const child of elementNames.process.children) {
            const childElements = this.getElementsByType(subProcess, child);
            basicData[child] = childElements;
          }
        }

        //get the sequence flows
        const sequenceFlows = this.getSequenceFlows(subProcess);
        basicData["sequenceFlows"] = sequenceFlows;

        subProcesses.push(basicData);
      }
      return subProcesses;
    } else {
      return [];
    }
  }
}

const localUtils = {
  //get extension elements
  getExtensionElements: (bpmnElement) => {
    const extensionElements = bpmnElement["bpmn2:extensionElements"];
    return extensionElements;
  },

  //get property by name
  getPropertyByName: (bpmnElement, propertyName) => {
    const extensionElements = localUtils.getExtensionElements(bpmnElement);
    if (extensionElements) {
      const properties = extensionElements["ifl:property"];
      const property = properties.filter(
        (property) => property["key"]["_"] === propertyName
      );
      if (property.length > 0) {
        return property[0]["value"]["_"];
      }
    }
    return "";
  },
  //get property activityType
  getPropertyActivityType: (bpmnElement) => {
    const extensionElements = localUtils.getExtensionElements(bpmnElement);
    //get property activityType
    if (extensionElements) {
      const properties = extensionElements["ifl:property"];
      //get property with key activityType using filter
      const property = properties.filter(
        (property) => property["key"]["_"] === "activityType"
      );
      if (property.length > 0) {
        return property[0]["value"]["_"];
      }
    }
    return "";
  },
  //extract the basic data from the xml
  extractBasicData: (bpmnElement) => {
    const basicData = {};

    //loop through the attribute paths and extract the data
    for (const attributePath in attributePaths) {
      if (bpmnElement[attributePaths[attributePath][0]]) {
        basicData[attributePath] =
          bpmnElement[attributePaths[attributePath][0]][
            attributePaths[attributePath][1]
          ];
      }
    }

    //if it is call activity, then get type of the call activity
    if (bpmnElement["$ns"]["local"] === "callActivity") {
      basicData.activityType = localUtils.getPropertyActivityType(bpmnElement);
    }
    return basicData;
  },
  getMessageFlowAddress: async (instance, type, messageFlow) => {
    const ret = {
      addressRef: "",
      addressResolved: "",
    };
    //switch based on the type
    switch (type) {
      case "ProcessDirect":
        ret.addressRef = localUtils
          .getPropertyByName(messageFlow, "address")
          .replace("{{", "")
          .replace("}}", "");
        ret.addressResolved = await instance.getConfigurationParameterByName(
          ret.addressRef
        );
        break;
      case "Mail":
        ret.addressRef = localUtils
          .getPropertyByName(messageFlow, "server")
          .replace("{{", "")
          .replace("}}", "");
        ret.addressResolved = await instance.getConfigurationParameterByName(
          ret.addressRef
        );
        break;
      case 'LDAP':
        ret.addressRef = localUtils
          .getPropertyByName(messageFlow, "ldapAddress")
          .replace("{{", "")
          .replace("}}", "");
        ret.addressResolved = await instance.getConfigurationParameterByName(
          ret.addressRef
        );        
        break;
      //case for HTTP and HTTPS
      case "HTTP":
      case 'HTTPS':
      // case "HTTP" || 'HTTPS':
        ret.addressRef = localUtils
          .getPropertyByName(messageFlow, "httpAddressWithoutQuery")
          .replace("{{", "")
          .replace("}}", "");
//TODO: maybe it would be better to decide upon sender/receiver direction
        if (ret.addressRef === "") {
          ret.addressRef = localUtils
            .getPropertyByName(messageFlow, "urlPath")
            .replace("{{", "")
            .replace("}}", "");
        }
        ret.addressResolved = await instance.getConfigurationParameterByName(
          ret.addressRef
        );
        break;
      default:
    }
    return ret;
  },
};

module.exports = IFlowParser;


//TODO: Tidy up the code
//   //get the process elements from the xml
//   async getProcessElements() {
//     const processElements = {
//       processes: {},
//       participants: [],
//       messageFlows: [],
//     };
//     const processElement = elementNames.process;

//     // Get all process elements from the parsed XML
//     const processesData =
//       this.xmlData[elementNames.definitions.id]?.[
//         elementNames.definitions.children[0]
//       ];
//     if (processesData) {
//       const outputProc = [];
//       const processArray = Array.isArray(processesData)
//         ? processesData
//         : [processesData];
//       for (const process of processArray) {
//         try {
//           const processBasicData = localUtils.extractBasicData(process);

//           //get child elements loop through the children and get the elements
//           for (const child of processElement.children) {
//             const childElements = this.getElementsByType(process, child);
//             processBasicData[child] = childElements;
//           }

//           //get the sequence flows
//           const sequenceFlows = this.getSequenceFlows(process);
//           processBasicData["sequenceFlows"] = sequenceFlows;

//           //get the sub processes
//           const subProcesses = this.getSubProcesses(process);
//           processBasicData["subProcesses"] = subProcesses;

//           processElements.processes[processBasicData.id] = processBasicData;
//         } catch (error) {
//           console.log(error);
//         }
//       }
//     }

//     //get the participants
//     //get collaboration elements
//     const collaboration =
//       this.xmlData[elementNames.definitions.id]?.["bpmn2:collaboration"];
//     processElements["participants"] =
//       this.getParticipantElements(collaboration);

//     //get the message flows
//     processElements["messageFlows"] = await this.getMessageFlows(collaboration);

//     return processElements;
//   }