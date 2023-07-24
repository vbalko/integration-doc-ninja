class BPMNtoMermaid {
  constructor(json) {
    this.json = json;
  }

  shapeModifier(text, shape) {
    const shapeMap = {
      'round': `(${text})`,
      'stadium': `[${text}]`,
      'subroutine': `[[${text}]]`,
      'cylindrical': `(${text})`,
      'circle': `((${text}))`,
      'asymmetric': `>${text}]`,
      'diamond': `{${text}}`,
      'hexagon': `{{${text}}}`,
      'parallelogram': `[/${text}/]`,
      'trapezoid': `[/${text}\\]`,
      'doubleCircle': `((${text}))`,
    };

    return shapeMap[shape] || text;
  }

  showElement(elementId, elementName, shape) {
    return `    ${elementId}${this.shapeModifier(elementName, shape)}\n`;
  }

  showStartEvent(startEvent) {
    const startEventId = startEvent.id;
    const startEventName = this.showElement(startEventId, startEvent.name, 'circle');
    return startEventName;
  }

  showEndEvent(endEvent) {
    const endEventId = endEvent.id;
    const endEventName = this.showElement(endEventId, endEvent.name, 'circle');
    return endEventName;
  }

  showCallActivity(event) {
    const eventId = event.id;
    const activityType = event.activityType;
    //for each activity type, show a different shape
    let shape = 'stadium';
    switch (activityType) {
      case 'Splitter':
        shape = 'subroutine';
        break;
      case 'Script':
        shape = 'hexagon';
        break;
      case 'JsonToXmlConverter':
        shape = 'parallelogram';
        break;
        case 'ProcessCallElement':
          shape = 'subroutine';
          break;  
          case 'Enricher':
            shape = 'trapezoid';
            break;                
      default:
    }
    const eventName = this.showElement(eventId, event.name, shape);

    return eventName;
  }

  showExclusiveGateway(gateway) {
    const gatewayId = gateway.id;
    const gatewayName = this.showElement(gatewayId, gateway.name, 'diamond');
    return gatewayName;
  }

  showSubProcess(subProcess) {
    const subProcessId = subProcess.id;
    //const subProcessName = this.showElement(subProcessId, subProcess.name, 'subroutine');
    const subProcessName = subProcess.name;

    let subProcessCode = `  subgraph ${subProcessId} [${subProcessName}]\n`;
    subProcessCode += '    direction LR\n'; // Set subgraph orientation to LR using "direction"

    if (subProcess.startEvent) {
      subProcess.startEvent.forEach((startEvent) => {
        subProcessCode += this.showStartEvent(startEvent);
      });
    }

    if (subProcess.callActivity) {
      subProcess.callActivity.forEach((callActivity) => {
        subProcessCode += this.showCallActivity(callActivity);
      });
    }

    subProcessCode += '  end\n'; // Close the subgraph

    return subProcessCode;
  }

  showServiceTask(serviceTask) {
    const serviceTaskId = serviceTask.id;
    const serviceTaskName = this.showElement(serviceTaskId, serviceTask.name, 'stadium');
    return serviceTaskName;
  }

  showParticipant(participant) {
    const participantId = participant.id;
    const participantName = this.showElement(participantId, participant.name, 'stadium');
    return participantName;
  }

  showSequenceFlow(sequenceFlow) {
    const sourceRef = sequenceFlow.sourceRef;
    const targetRef = sequenceFlow.targetRef;
    // if linkText is empty, use the sourceRef and targetRef
    const linkText = sequenceFlow.name || '';
    if (!linkText) {
      return `    ${sourceRef} --> ${targetRef}\n`;
    } else {
      return `    ${sourceRef} -->|${linkText}|${targetRef}\n`;
    }
  }

  convertToMermaid() {
    let mermaidCode = 'flowchart LR\n';

    Object.values(this.json).forEach((process) => {
      const processId = process.id;
      const processName = process.name;

      mermaidCode += `  subgraph ${processId}[${processName}]\n`;
      mermaidCode += '    direction LR\n'; // Set subgraph orientation to LR using "direction"

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
          mermaidCode += this.showCallActivity(event);
        });
      }      

      if (process.exclusiveGateway) {
        process.exclusiveGateway.forEach((gateway) => {
          mermaidCode += this.showExclusiveGateway(gateway);
        });
      }

      if (process.subProcess) {
        process.subProcess.forEach((subProcess) => {
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

      mermaidCode += '  end\n'; // Close the subgraph
    });

    return mermaidCode;
  }
}

module.exports = BPMNtoMermaid;