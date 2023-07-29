/**
 * BPMNtoMermaid
 *
 * Converts BPMN diagrams to Mermaid diagrams.
 *
 * Usage:
 * const bpmnToMermaid = new BPMNtoMermaid(bpmnXml);
 * const mermaidCode = bpmnToMermaid.createFlowchart(); // for flowchart
 *
 * To add support for a new event:
 * 1. Add the event to the `supportedEvents` object.
 * 2. Create a new method to show the event in the Mermaid diagram.
 *
 * To add support for a new call activity:
 * 1. Add the call activity to the `supportedCallActivities` object.
 * 2. Create a new method to show the call activity in the Mermaid diagram.
 */

/**
 * An array of objects representing the supported BPMN events.
 * Each object contains the following properties:
 * - name: the name of the event
 * - id: the ID of the event
 * - supported: a boolean indicating whether the event is supported (if false, the event will not be shown in the Mermaid diagram)
 * - showMethod: the name of the method used to show the event in the Mermaid diagram
 * - showInProcess: a boolean indicating whether the event should be shown in a process diagram
 * - showInSubProcess: a boolean indicating whether the event should be shown in a subprocess diagram
 * - showInExceptionSubProcess: a boolean indicating whether the event should be shown in an exception subprocess diagram
 */
const supportedEvents = [
  {
    name: "startEvent",
    id: "startEvent",
    supported: true,
    showMethod: "showStartEvent",
    showInProcess: true,
    showInSubProcess: true,
    showInExceptionSubProcess: true,
  },
  {
    name: "endEvent",
    id: "endEvent",
    supported: true,
    showMethod: "showEndEvent",
    showInProcess: true,
    showInSubProcess: true,
    showInExceptionSubProcess: true,
  },
  {
    name: "callActivity",
    id: "callActivity",
    supported: true,
    showMethod: "showCallActivity",
    showInProcess: true,
    showInSubProcess: true,
    showInExceptionSubProcess: true,
  },
  {
    name: "exclusiveGateway",
    id: "exclusiveGateway",
    supported: true,
    showMethod: "showExclusiveGateway",
    showInProcess: true,
    showInSubProcess: true,
    showInExceptionSubProcess: true,
  },
  {
    name: "subProcess",
    id: "subProcesses",
    supported: true,
    showMethod: "showSubProcess",
    showInProcess: true,
    showInSubProcess: false,
    showInExceptionSubProcess: false,
  },
  {
    name: "serviceTask",
    id: "serviceTask",
    supported: true,
    showMethod: "showServiceTask",
    showInProcess: true,
    showInSubProcess: true,
    showInExceptionSubProcess: true,
  },
  {
    name: "participant",
    id: "participant",
    supported: true,
    showMethod: "showParticipant",
    showInProcess: false,
    showInSubProcess: false,
    showInExceptionSubProcess: false,
  },
  {
    name: "sequenceFlow",
    id: "sequenceFlows",
    supported: true,
    showMethod: "showSequenceFlow",
    showInProcess: true,
    showInSubProcess: true,
    showInExceptionSubProcess: true,
  },
];


/**
 * An object representing the supported call activities.
 * Each object contains the following properties:
 * - shape: the shape of the call activity
 * - classRef: the class reference of the call activity
 * - name: the name of the call activity
 * 
 * If the shape is not here, then the default shape is used.
 * 
 * The class reference is used to define the color of the call activity.
 * The class reference is defined in the `addClasses` method.
 * 
 * To add support for a new call activity:
 * 1. Add the class reference to the `addClasses` method.
 * 2. Add the call activity to the `callActivities` object.
 **/
const callActivities = {
  Splitter: {
    shape: "subroutine",
    classRef: "classSplitter",
    name: "Splitter",
  },
  Script: { shape: "hexagon", classRef: "classScript", name: "Script" },
  JsonToXmlConverter: {
    shape: "parallelogram",
    classRef: "classJsonToXmlConverter",
    name: "Json to XML Converter",
  },
  XmlToJsonConverter: {
    shape: "parallelogram",
    classRef: "classXmlToJsonConverter",
    name: "XML to Json Converter",
  },  
  ProcessCallElement: {
    shape: "subroutine",
    classRef: "classProcessCallElement",
    name: "Process Call Element",
  },
  Mapping: {
    shape: "subroutine",
    classRef: "classMapping",
    name: "Mapping",
  },  
  Enricher: {
    shape: "trapezoid",
    classRef: "classEnricher",
    name: "Content Modifier",
  },
  ExternalCall: {
    shape: "asymmetric",
    classRef: "classExternalCall",
    name: "External Call",
  },
};

/**
 * Converts BPMN diagrams to Mermaid diagrams.
 * @class
 * @classdesc This class provides methods for converting BPMN diagrams to Mermaid diagrams.
 * It takes a BPMN diagram in JSON format as input and outputs a Mermaid diagram in text format.
 * The class supports a variety of BPMN elements, including start events, end events, tasks, gateways, and more.
 * It also supports custom call activities, which can be defined using a map of activity names to shapes and class references.
 */
class BPMNtoMermaid {
  constructor(json) {
    this.json = json;
  }

  shapeModifier(text, shape) {
    const shapeMap = {
      round: `(${text})`,
      stadium: `[${text}]`,
      subroutine: `[[${text}]]`,
      cylindrical: `[(${text})]`,
      circle: `((${text}))`,
      asymmetric: `>${text}]`,
      diamond: `{${text}}`,
      hexagon: `{{${text}}}`,
      parallelogram: `[/${text}/]`,
      trapezoid: `[/${text}\\]`,
      doubleCircle: `((${text}))`,
    };

    return shapeMap[shape] || text;
  }

  showElement(elementId, elementName, shape, classRef = null) {
    //if classRef is null, then dont use it
    if (classRef === null) {
      return `    ${elementId}${this.shapeModifier(elementName, shape)}\n`;
    }
    //else use it
    return `    ${elementId}${this.shapeModifier(
      elementName,
      shape
    )}:::${classRef}\n`;
  }

  showParticipant(participant) {
    const { id, name, iflType } = participant;

    //if participantType is IntegrationProcess, then dont show it
    if (iflType === "IntegrationProcess") {
      return "";
    }
    return this.showElement(id, name, "cylindrical");
  }

  showStartEvent(startEvent) {
    const { id, name = "" } = startEvent;
    const ret = `%% Start Event\n ${this.showElement(id, name, "circle")}`;
    return ret;
  }

  showEndEvent(endEvent) {
    const { id, name = "" } = endEvent;
    const ret = `%% End Event\n ${this.showElement(id, name, "circle")}`;
    return ret;
  }

  showCallActivity(event) {
    const { id, activityType, name = "" } = event;
    const { shape, classRef } = callActivities[activityType] || {
      shape: "stadium",
      classRef: "classDefault",
    };

    return `%% callActivity: ${activityType}\n ${this.showElement(
      id,
      name,
      shape,
      classRef
    )}`;
  }

  showExclusiveGateway(gateway) {
    const { id, name = "" } = gateway;
    const ret = `%% ExclusiveGateway\n ${this.showElement(
      id,
      name,
      "diamond"
    )}`;
    return ret;
  }

  showSubProcess(subProcess) {
    const { id, name = "" } = subProcess;

    let subProcessCode = `%% Subprocess: ${name}\n  subgraph ${id}[${name}]\n`;
    subProcessCode += "    direction LR\n"; // Set subgraph orientation to LR using "direction"

    const events = localUtils.getSupportedEventsInSubProcess();

    //loop through all events
    for (const event of events) {
      const { name, showMethod, id } = event;
      //if the event exists in the sub process, then show it
      if (subProcess[id]) {
        //loop through all events of the same type
        for (const event2 of subProcess[id]) {
          subProcessCode += this[showMethod](event2);
        }
      }
    }

    subProcessCode += "  end\n"; // Close the subgraph

    return subProcessCode;
  }

  showServiceTask(serviceTask) {
    const { id, name = "" } = serviceTask;
    const serviceTaskName = `%%Service Task ${this.showElement(
      id,
      name,
      "stadium"
    )}`;
    return serviceTaskName;
  }

  showSequenceFlow(sequenceFlow) {
    const {
      sourceRef,
      targetRef,
      name = "",
      addressResolved = "",
      type,
    } = sequenceFlow;
    const linkText = name ? `|${name}|` : "";
    const protocol = name ? `%% Protocol: ${name}\n` : "";
    const address = addressResolved ? `%% Address: ${addressResolved}\n` : "";

    return `%% ${type}\n${protocol}${address}    ${sourceRef} -->${linkText}${targetRef}\n`;
  }

  addLegend() {
    //loop through all call activities and add them to the legend
    const legend = Object.entries(callActivities).reduce(
      (acc, [key, value]) => {
        const { shape, classRef, name } = value;
        return acc + this.showElement(`legend${key}`, name, shape, classRef);
      },
      ""
    );

    return `subgraph Legend\n  direction LR\n  ${legend}\nend\n`;
  }

  processParticipants(participants) {
    let ret = "";
    for (const participant of participants) {
      const { id, name } = participant;
      ret += `%% PARTICIPANT ${name}\n ${this.showParticipant(participant)}`;
    }
    return ret;
  }

  processMessageFlows(messageFlows) {
    let ret = "";
    for (const messageFlow of messageFlows) {
      ret += this.showSequenceFlow(messageFlow);
    }
    return ret;
  }

  processProcesses(processes) {
    const events = localUtils.getSupportedEventsInProcess();

    //loop through all processes
    let ret = "";
    for (const process of processes) {
      const { id, name } = process;
      ret += `%%Process\n  subgraph ${id}[${name}]\n   direction LR\n`;

      //loop through all events
      for (const event of events) {
        const { name, showMethod, id } = event;
        //if the event exists in the process, then show it
        if (process[id]) {
          //loop through all events of the same type
          for (const event of process[id]) {
            ret += this[showMethod](event);
          }
        }
      }
      ret += "  end\n"; // Close the subgraph
    }

    return ret;
  }

/**
 * Creates a Mermaid flowchart based on the BPMN diagram in JSON format.
 * The method processes participants, message flows, and processes to generate the flowchart.
 * It also defines classes for each call activity type.
 * @returns {string} The Mermaid code for the flowchart.
 */
  createFlowchart() {
    let mermaidCode = "flowchart LR\n";
    mermaidCode += this.addLegend();

    mermaidCode += this.processParticipants(this.json.participants);

    mermaidCode += this.processMessageFlows(this.json.messageFlows);

    mermaidCode += this.processProcesses(this.json.processes);

    mermaidCode += "\n"; // Newline after the flowchart

    // Define classes for each call activity type
    mermaidCode += localUtils.addClasses();

    return mermaidCode;
  }

  createOverviewFlowchart(data) {
    let mermaidCode = "flowchart LR\n";

    for (const process of data.processes) {
      const { iflowId, sender, receiver } = process;
      mermaidCode += `%% Process: ${iflowId}\n`;
      mermaidCode += `${iflowId}[${iflowId}]\n`;
    }

    for (const messageFlow of data.messageFlows) {
      mermaidCode += this.showSequenceFlow(messageFlow);
    }
    

    mermaidCode += "\n"; // Newline after the flowchart

    // Define classes for each call activity type
    // mermaidCode += localUtils.addClasses();

    return mermaidCode;
  }

}

module.exports = BPMNtoMermaid;

const localUtils = {
  getRandomPastelColor: () => {
    const hue = Math.floor(Math.random() * 360);
    const pastelSaturation = Math.floor(Math.random() * 30) + 70; // Saturation between 70 and 100 (pastel range)
    const pastelLightness = Math.floor(Math.random() * 30) + 50; // Lightness between 50 and 80 (pastel range)
    return `hsl(${hue}, ${pastelSaturation}%, ${pastelLightness}%)`;
  },
  addClasses: () => {
    const classes = `classDef classSplitter stroke:#000,fill:#FFDAB9;\n
      classDef classScript stroke:#000,fill:#FFC0CB;\n
      classDef classJsonToXmlConverter stroke:#000,fill:#98FB98;\n
      classDef classXmlToJsonConverter stroke:#000,fill:#98FB98;\n
      classDef classProcessCallElement stroke:#000,fill:#B0E0E6;\n
      classDef classEnricher stroke:#000,fill:#b8c9ff;\n
      classDef classExternalCall stroke:#000,fill:#ffb8ff;\n
      classDef classMapping stroke:#000,fill:#ffebcc;\n
      classDef classDefault stroke:#000,fill:#FF0000;\n
      style Process_1 fill:#E0FFFF,stroke:#000;\n
      style Legend fill:#98FB98,stroke:#000;\n
      `;
      return classes;
  },
  getSupportedEvents: () => {
    return supportedEvents.filter((event) => event.supported);
  },
  getSupportedEventsInProcess: () => {
    return localUtils
      .getSupportedEvents()
      .filter((event) => event.showInProcess);
  },
  getSupportedEventsInSubProcess: () => {
    return localUtils
      .getSupportedEvents()
      .filter((event) => event.showInSubProcess);
  },

};

//TODO backup
// showParticipant(participant) {
//   const participantId = participant.id;
//   const participantName = this.showElement(
//     participantId,
//     participant.name,
//     "stadium"
//   );
//   return participantName;
// }

// showSequenceFlow(sequenceFlow) {
//   let ret = "";
//   const sourceRef = sequenceFlow.sourceRef;
//   const targetRef = sequenceFlow.targetRef;
//   // if linkText is empty, use the sourceRef and targetRef
//   const linkText = sequenceFlow.name || "";
//   const addressResolved = sequenceFlow.addressResolved || "";
//   const name = sequenceFlow.name || "";

//   ret += `    %% Protocol: ${name}\n`;
//   ret += `    %% Address: ${addressResolved}\n`;

//   if (!linkText) {
//     ret += `    ${sourceRef} --> ${targetRef}\n`;
//   } else {
//     ret += `    ${sourceRef} -->|${linkText}|${targetRef}\n`;
//   }
//   return ret;
// }
