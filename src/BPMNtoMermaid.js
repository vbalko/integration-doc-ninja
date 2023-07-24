class BPMNtoMermaid {
  constructor(json) {
    this.json = json;
  }

  getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    const pastelSaturation = Math.floor(Math.random() * 30) + 70; // Saturation between 70 and 100 (pastel range)
    const pastelLightness = Math.floor(Math.random() * 30) + 50; // Lightness between 50 and 80 (pastel range)
    return `hsl(${hue}, ${pastelSaturation}%, ${pastelLightness}%)`;
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
    const participantId = participant.id;
    const participantName = participant.name;
    const participantType = participant.iflType;

    //if participantType is IntegrationProcess, then dont show it
    if (participantType === "IntegrationProcess") {
      return "";
    };

    return this.showElement(participantId, participantName, "cylindrical");
  }

  showStartEvent(startEvent) {
    const startEventId = startEvent.id;
    const startEventName = this.showElement(
      startEventId,
      startEvent.name,
      "circle"
    );
    return startEventName;
  }

  showEndEvent(endEvent) {
    const endEventId = endEvent.id;
    const endEventName = this.showElement(endEventId, endEvent.name, "circle");
    return endEventName;
  }

  showCallActivity(event) {
    const eventId = event.id;
    const activityType = event.activityType;
    let shape = "stadium";
    let fillColor = "#E0FFFF"; // Default pastel color

    switch (activityType) {
      case "Splitter":
        shape = "subroutine";
        break;
      case "Script":
        shape = "hexagon";
        break;
      case "JsonToXmlConverter":
        shape = "parallelogram";
        break;
      case "ProcessCallElement":
        shape = "subroutine";
        break;
      case "Enricher":
        shape = "trapezoid";
        break;
      case "ExternalCall":
        shape = "asymmetric";
        break;
      default:
    }

    const classRef = `class${activityType}`;
    const eventName = this.showElement(eventId, event.name, shape, classRef);

    return `${eventName}`;
  }

  showExclusiveGateway(gateway) {
    const gatewayId = gateway.id;
    const gatewayName = this.showElement(gatewayId, gateway.name, "diamond");
    return gatewayName;
  }

  showSubProcess(subProcess) {
    const subProcessId = subProcess.id;
    const subProcessName = subProcess.name;

    let subProcessCode = `  subgraph ${subProcessId}[${subProcessName}]\n`;
    subProcessCode += "    direction LR\n"; // Set subgraph orientation to LR using "direction"

    if (subProcess.startEvent) {
      subProcess.startEvent.forEach((startEvent) => {
        subProcessCode += this.showStartEvent(startEvent);
      });
    }

    if (subProcess.endEvent) {
      subProcess.endEvent.forEach((endEvent) => {
        subProcessCode += this.showEndEvent(endEvent);
      });
    }

    if (subProcess.callActivity) {
      subProcess.callActivity.forEach((event) => {
        const callActivityCode = this.showCallActivity(event);
        subProcessCode += callActivityCode;
      });
    }

    if (subProcess.exclusiveGateway) {
      subProcess.exclusiveGateway.forEach((gateway) => {
        subProcessCode += this.showExclusiveGateway(gateway);
      });
    }

    if (subProcess.serviceTask) {
      subProcess.serviceTask.forEach((serviceTask) => {
        subProcessCode += this.showServiceTask(serviceTask);
      });
    }

    if (subProcess.participant) {
      subProcess.participant.forEach((participant) => {
        subProcessCode += this.showParticipant(participant);
      });
    }

    if (subProcess.sequenceFlows) {
      subProcess.sequenceFlows.forEach((sequenceFlow) => {
        subProcessCode += this.showSequenceFlow(sequenceFlow);
      });
    }

    subProcessCode += "  end\n"; // Close the subgraph

    return subProcessCode;
  }

  showServiceTask(serviceTask) {
    const serviceTaskId = serviceTask.id;
    const serviceTaskName = this.showElement(
      serviceTaskId,
      serviceTask.name,
      "stadium"
    );
    return serviceTaskName;
  }

  // showParticipant(participant) {
  //   const participantId = participant.id;
  //   const participantName = this.showElement(
  //     participantId,
  //     participant.name,
  //     "stadium"
  //   );
  //   return participantName;
  // }

  showSequenceFlow(sequenceFlow) {
    const sourceRef = sequenceFlow.sourceRef;
    const targetRef = sequenceFlow.targetRef;
    // if linkText is empty, use the sourceRef and targetRef
    const linkText = sequenceFlow.name || "";
    if (!linkText) {
      return `    ${sourceRef} --> ${targetRef}\n`;
    } else {
      return `    ${sourceRef} -->|${linkText}|${targetRef}\n`;
    }
  }

  addLegend() {
    let legend = `subgraph Legend\n`;
    legend += `  direction LR\n`;
    legend += `  ${this.showElement(
      "legendEnricher",
      "Content Modifier",
      "trapezoid",
      "classEnricher"
    )}\n`;
    legend += `  ${this.showElement(
      "legendJsonToXmlConverter",
      "Json to XML Converter",
      "parallelogram",
      "classJsonToXmlConverter"
    )}\n`;
    legend += `  ${this.showElement(
      "legendProcessCallElement",
      "Process Call Element",
      "subroutine",
      "classProcessCallElement"
    )}\n`;
    legend += `  ${this.showElement(
      "legendScript",
      "Script",
      "hexagon",
      "classScript"
    )}\n`;
    legend += `  ${this.showElement(
      "legendSplitter",
      "Splitter",
      "subroutine",
      "classSplitter"
    )}\n`;
    legend += `end\n`;
    return legend;
  }

  convertToMermaid() {
    let mermaidCode = "flowchart LR\n";
    mermaidCode += this.addLegend();

    //loop through all participants
    Object.values(this.json.participants).forEach((participant) => {
      const participantId = participant.id;
      const participantName = participant.name;

      //add comment participant
      mermaidCode += `%% PARTICIPANT ${participantName}\n`;
      mermaidCode += this.showParticipant(participant);
    });

    //loop through all message flows
    Object.values(this.json.messageFlows).forEach((messageFlow) => {
      mermaidCode += this.showSequenceFlow(messageFlow);
    });

    // Loop through all processes
    Object.values(this.json.processes).forEach((process) => {
      const processId = process.id;
      const processName = process.name;

      mermaidCode += `  subgraph ${processId}[${processName}]\n`;
      mermaidCode += "    direction LR\n"; // Set subgraph orientation to LR using "direction"

      if (process.startEvent) {
        process.startEvent.forEach((startEvent) => {
          mermaidCode += this.showStartEvent(startEvent);
        });
      }

      if (process.endEvent) {
        process.endEvent.forEach((endEvent) => {
          mermaidCode += this.showEndEvent(endEvent);
        });
      }

      if (process.callActivity) {
        process.callActivity.forEach((event) => {
          const callActivityCode = this.showCallActivity(event);
          mermaidCode += callActivityCode;
        });
      }

      if (process.exclusiveGateway) {
        process.exclusiveGateway.forEach((gateway) => {
          mermaidCode += this.showExclusiveGateway(gateway);
        });
      }

      if (process.subProcesses) {
        process.subProcesses.forEach((subProcess) => {
          mermaidCode += this.showSubProcess(subProcess);
        });
      }

      if (process.serviceTask) {
        process.serviceTask.forEach((serviceTask) => {
          mermaidCode += this.showServiceTask(serviceTask);
        });
      }

      if (process.participant) {
        process.participant.forEach((participant) => {
          mermaidCode += this.showParticipant(participant);
        });
      }

      if (process.sequenceFlows) {
        process.sequenceFlows.forEach((sequenceFlow) => {
          mermaidCode += this.showSequenceFlow(sequenceFlow);
        });
      }

      mermaidCode += "  end\n"; // Close the subgraph
    });

    mermaidCode += "\n"; // Newline after the flowchart

    // Define classes for each call activity type
    mermaidCode += `classDef classSplitter stroke:#000,fill:#FFDAB9;
classDef classScript stroke:#000,fill:#FFC0CB;
classDef classJsonToXmlConverter stroke:#000,fill:#98FB98;
classDef classProcessCallElement stroke:#000,fill:#B0E0E6;
classDef classEnricher stroke:#000,fill:#FFB6C1;
classDef classExternalCall stroke:#000,fill:#FFB6C1;
style Process_1 fill:#E0FFFF,stroke:#000;
style Legend fill:#98FB98,stroke:#000;
`;

    return mermaidCode;
  }
}

module.exports = BPMNtoMermaid;
