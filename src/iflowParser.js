//class for parsing the iflow xml which is standard bpmn 2.0 xml format with extensions for iflow
const attributePaths = {
    id: ["id", "value"],
    name: ["name", "value"]
}

const elementNames = {
    definitions: {id:"bpmn2:definitions",children:["bpmn2:process"]},
    process: {id:"bpmn2:process",children:["startEvent","endEvent","exclusiveGateway","subProcess","serviceTask","participant","callActivity"]},
    startEvent: {id:"bpmn2:startEvent",children:[]},
    endEvent: {id:"bpmn2:endEvent",children:[]},
    exclusiveGateway: {id:"bpmn2:exclusiveGateway",children:[]},
    subProcess: {id:"bpmn2:subProcess",children:[]},
    serviceTask: {id:"bpmn2:serviceTask",children:[]},
    participant: {id:"bpmn2:participant",children:[]},
    callActivity: {id:"bpmn2:callActivity",children:[], type:""}
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

    //get the process elements from the xml
    getProcessElements() {
        const processElements = {};
        const processElement = elementNames.process;

        // Get all process elements from the parsed XML
        const processes = this.xmlData[elementNames.definitions.id]?.[elementNames.definitions.children[0]];
        if (processes) {
            const processArray = Array.isArray(processes) ? processes : [processes];
            for (const process of processArray) {
                const processBasicData = this.extractBasicData(process);

                //get child elements loop through the children and get the elements
                for (const child of processElement.children) {
                    const childElements = this.getElementsByType(process,child);
                    processBasicData[child] = childElements;
                }

                //get the sequence flows
                const sequenceFlows = this.getSequenceFlows(process);
                processBasicData["sequenceFlows"] = sequenceFlows;

                processElements[processBasicData.id] = processBasicData;
            };
        }

        return processElements;
    }

}

module.exports = IFlowParser;