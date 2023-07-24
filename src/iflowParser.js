//class for parsing the iflow xml which is standard bpmn 2.0 xml format with extensions for iflow
const attributePaths = {
    id: ["id", "value"],
    name: ["name", "value"]
}

const elementNames = {
    definitions: {id:"bpmn2:definitions",children:["bpmn2:process"]},
    process: {id:"bpmn2:process",children:["startEvent","endEvent","exclusiveGateway","serviceTask","participant","callActivity"]},
    startEvent: {id:"bpmn2:startEvent",children:[]},
    endEvent: {id:"bpmn2:endEvent",children:[]},
    exclusiveGateway: {id:"bpmn2:exclusiveGateway",children:[]},
 //   subProcess: {id:"bpmn2:subProcess",children:[]},
    serviceTask: {id:"bpmn2:serviceTask",children:[]},
    participant: {id:"bpmn2:participant",children:[]},
    callActivity: {id:"bpmn2:callActivity",children:[], type:""}
}

const exceptionSubProcess = {
    id: "bpmn2:subProcess",
    children: ["startEvent","endEvent","exclusiveGateway","serviceTask","participant","callActivity"]
}

class IFlowParser {
    constructor(xmlData) {
        this.xmlData = xmlData;
    }

    //set the xml data
    setXmlData(xmlData) {
        this.xmlData = xmlData;
    }

    //get extension elements
    getExtensionElements(bpmnElement) {
        const extensionElements = bpmnElement["bpmn2:extensionElements"];
        return extensionElements;
    }

    //get property by name
    getPropertyByName(bpmnElement, propertyName) {
        const extensionElements = this.getExtensionElements(bpmnElement);
        if (extensionElements) {
            const properties = extensionElements["ifl:property"];
            const property = properties.filter((property) => property["key"]["_"] === propertyName);
            if (property.length > 0) {
                return property[0]["value"]["_"];
            }
        }
        return "";
    }

    //get property activityType
    getPropertyActivityType(bpmnElement) {
        const extensionElements = this.getExtensionElements(bpmnElement);
        //get property activityType
        if (extensionElements) {
            const properties = extensionElements["ifl:property"];
            //get property with key activityType using filter
            const property = properties.filter((property) => property["key"]["_"] === "activityType");
            if (property.length > 0) {
                return property[0]["value"]["_"];
            }
        }
        return "";
    }



    //extract the basic data from the xml
    extractBasicData(bpmnElement) {
        const basicData = {};

        //loop through the attribute paths and extract the data
        for (const attributePath in attributePaths) {
            if (bpmnElement[attributePaths[attributePath][0]]) {
                basicData[attributePath] = bpmnElement[attributePaths[attributePath][0]][attributePaths[attributePath][1]];
            }  
        }

        //if it is call activity, then get type of the call activity 
        if (bpmnElement["$ns"]["local"] === "callActivity") {
            basicData.activityType = this.getPropertyActivityType(bpmnElement);
        }
        return basicData;
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
            const participantArray = Array.isArray(participantsRecords) ? participantsRecords : [participantsRecords];
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
    getMessageFlows(inputXML) {
        const messageFlows = [];
        const messageFlowsRecords = inputXML["bpmn2:messageFlow"];
        if (messageFlowsRecords) {
            const messageFlowArray = Array.isArray(messageFlowsRecords) ? messageFlowsRecords : [messageFlowsRecords];
            for (const messageFlow of messageFlowArray) {
                const basicData = {};
                basicData.id = messageFlow["id"].value;
                basicData.name = messageFlow["name"]?.value || "";
                basicData.sourceRef = messageFlow["sourceRef"].value;
                basicData.targetRef = messageFlow["targetRef"].value;
                basicData.type = "bpmn2:messageFlow"; // Add the type of element
                basicData.addressRef = this.getPropertyByName(messageFlow, "address");
                basicData.addressResolved = "";
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
            const elementArray = Array.isArray(elementsOfType) ? elementsOfType : [elementsOfType];
            for (const element of elementArray) {
                const basicData = this.extractBasicData(element);
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
                conditionExpression: data.conditionExpression ? data.conditionExpression["bpmn2:conditionExpression"]["#text"] : ""
            }
        }
        const sequenceFlows = [];
        const sequenceFlowsRecords = inputXML["bpmn2:sequenceFlow"];
        if (sequenceFlowsRecords) {
            const sequenceFlowArray = Array.isArray(sequenceFlowsRecords) ? sequenceFlowsRecords : [sequenceFlowsRecords];
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
            const subProcessArray = Array.isArray(subProcessesRecords) ? subProcessesRecords : [subProcessesRecords];
            for (const subProcess of subProcessArray) {
                const basicData = this.extractBasicData(subProcess);
                basicData.type = "bpmn2:subProcess"; // Add the type of element


                //get subprocess activity type
                const type = this.getPropertyActivityType(subProcess);

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

    //get the process elements from the xml
    getProcessElements() {

        const processElements = {
            processes: {},
            participants: [],
            messageFlows: []
        };
        const processElement = elementNames.process;

        // Get all process elements from the parsed XML
        const processesData = this.xmlData[elementNames.definitions.id]?.[elementNames.definitions.children[0]];
        if (processesData) {
            const outputProc = [];
            const processArray = Array.isArray(processesData) ? processesData : [processesData];
            for (const process of processArray) {
                try {
                    const processBasicData = this.extractBasicData(process);
                
                    //get child elements loop through the children and get the elements
                    for (const child of processElement.children) {
                        const childElements = this.getElementsByType(process,child);
                        processBasicData[child] = childElements;
                    }
    
                    //get the sequence flows
                    const sequenceFlows = this.getSequenceFlows(process);
                    processBasicData["sequenceFlows"] = sequenceFlows;
    
                    //get the sub processes
                    const subProcesses = this.getSubProcesses(process);
                    processBasicData["subProcesses"] = subProcesses;
    
                    processElements.processes[processBasicData.id] = processBasicData;
                } catch (error) {
                    console.log(error);
                }
            };
        }

        //get the participants
        //get collaboration elements
        const collaboration = this.xmlData[elementNames.definitions.id]?.["bpmn2:collaboration"];
        processElements["participants"] = this.getParticipantElements(collaboration);

        //get the message flows
        processElements["messageFlows"] = this.getMessageFlows(collaboration);

        return processElements;
    }

}

module.exports = IFlowParser;