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
  ProcessCallElement: {
    shape: "subroutine",
    classRef: "classProcessCallElement",
    name: "Process Call Element",
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
      classRef: classDefault,
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
      const { name, showMethod } = event;
      //if the event exists in the sub process, then show it
      if (subProcess[name]) {
        //loop through all events of the same type
        for (const event2 of subProcess[name]) {
          subProcessCode += this[showMethod](event2);
        }
      }
    }

    // if (subProcess.startEvent) {
    //   subProcess.startEvent.forEach((startEvent) => {
    //     subProcessCode += this.showStartEvent(startEvent);
    //   });
    // }

    // if (subProcess.endEvent) {
    //   subProcess.endEvent.forEach((endEvent) => {
    //     subProcessCode += this.showEndEvent(endEvent);
    //   });
    // }

    // if (subProcess.callActivity) {
    //   subProcess.callActivity.forEach((event) => {
    //     const callActivityCode = this.showCallActivity(event);
    //     subProcessCode += callActivityCode;
    //   });
    // }

    // if (subProcess.exclusiveGateway) {
    //   subProcess.exclusiveGateway.forEach((gateway) => {
    //     subProcessCode += this.showExclusiveGateway(gateway);
    //   });
    // }

    // if (subProcess.serviceTask) {
    //   subProcess.serviceTask.forEach((serviceTask) => {
    //     subProcessCode += this.showServiceTask(serviceTask);
    //   });
    // }

    // if (subProcess.participant) {
    //   subProcess.participant.forEach((participant) => {
    //     subProcessCode += this.showParticipant(participant);
    //   });
    // }

    // if (subProcess.sequenceFlows) {
    //   subProcess.sequenceFlows.forEach((sequenceFlow) => {
    //     subProcessCode += this.showSequenceFlow(sequenceFlow);
    //   });
    // }

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

  convertToMermaid() {
    let mermaidCode = "flowchart LR\n";
    mermaidCode += this.addLegend();
    // Loop through all participants
    // Object.values(this.json.participants).forEach((participant) => {
    //   const participantId = participant.id;
    //   const participantName = participant.name;

    //   // Add comment for participant
    //   mermaidCode += `%% PARTICIPANT ${participantName}\n`;
    //   mermaidCode += this.showParticipant(participant);
    // });
    mermaidCode += this.processParticipants(this.json.participants);

    mermaidCode += this.processMessageFlows(this.json.messageFlows);

    mermaidCode += this.processProcesses(this.json.processes);

    // // Loop through all message flows
    // Object.values(this.json.messageFlows).forEach((messageFlow) => {
    //   mermaidCode += this.showSequenceFlow(messageFlow);
    // });

    // // Loop through all processes
    // Object.values(this.json.processes).forEach((process) => {
    //   const { id, name } = process;

    //   // Add subgraph for process
    //   mermaidCode += `  subgraph ${processId}[${processName}]\n`;
    //   mermaidCode += "    direction LR\n"; // Set subgraph orientation to LR using "direction"

    //   // Show start events
    //   if (process.startEvent) {
    //     process.startEvent.forEach((startEvent) => {
    //       mermaidCode += this.showStartEvent(startEvent);
    //     });
    //   }

    //   // Show end events
    //   if (process.endEvent) {
    //     process.endEvent.forEach((endEvent) => {
    //       mermaidCode += this.showEndEvent(endEvent);
    //     });
    //   }

    //   // Show call activities
    //   if (process.callActivity) {
    //     process.callActivity.forEach((event) => {
    //       const callActivityCode = this.showCallActivity(event);
    //       mermaidCode += callActivityCode;
    //     });
    //   }

    //   // Show exclusive gateways
    //   if (process.exclusiveGateway) {
    //     process.exclusiveGateway.forEach((gateway) => {
    //       mermaidCode += this.showExclusiveGateway(gateway);
    //     });
    //   }

    //   // Show sub processes
    //   if (process.subProcesses) {
    //     process.subProcesses.forEach((subProcess) => {
    //       mermaidCode += this.showSubProcess(subProcess);
    //     });
    //   }

    //   // Show service tasks
    //   if (process.serviceTask) {
    //     process.serviceTask.forEach((serviceTask) => {
    //       mermaidCode += this.showServiceTask(serviceTask);
    //     });
    //   }

    //   // Show participants
    //   if (process.participant) {
    //     process.participant.forEach((participant) => {
    //       mermaidCode += this.showParticipant(participant);
    //     });
    //   }

    //   // Show sequence flows
    //   if (process.sequenceFlows) {
    //     process.sequenceFlows.forEach((sequenceFlow) => {
    //       mermaidCode += this.showSequenceFlow(sequenceFlow);
    //     });
    //   }

    //   mermaidCode += "  end\n"; // Close the subgraph
    // });

    mermaidCode += "\n"; // Newline after the flowchart

    // Define classes for each call activity type
    mermaidCode += localUtils.addClasses();

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
      classDef classProcessCallElement stroke:#000,fill:#B0E0E6;\n
      classDef classEnricher stroke:#000,fill:#b8c9ff;\n
      classDef classExternalCall stroke:#000,fill:#ffb8ff;\n
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
