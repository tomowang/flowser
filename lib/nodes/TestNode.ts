import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";
import { Info } from "lucide-vue-next";

export const TestNode: INodeType = {
  description: {
    displayName: "Test Node",
    name: "testNode",
    icon: Info,
    group: ["core"],
    version: 1,
    description: "Node for testing purposes",
    defaults: {
      name: "Test Node",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    credentials: [
      { name: "demo_credential", required: false, displayName: "Demo Credential" },
    ],
    properties: [
      {
        displayName: "Required Property",
        name: "requiredProp",
        type: "string",
        default: "",
        required: true,
        description: "A property required for testing validation",
      },
      {
        displayName: "Raise Error",
        name: "raiseError",
        type: "boolean",
        default: false,
        description: "If true, the node will raise an error during execution",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        const raiseError = this.getNodeParameter("raiseError", i) as boolean;
        const requiredProp = this.getNodeParameter("requiredProp", i) as string;

        if (raiseError) {
            throw new Error("Test Node Error: Execution failed as requested");
        }

        // Test credential loading
        let credentialData = null;
        try {
            credentialData = await this.getCredential?.("demo_credential");
        } catch (error) {
            // Ignore credential errors if not found, just for testing
            console.warn("Credential load failed or not set", error);
        }

        returnData.push({
            json: {
                message: "Test Node executed successfully",
                receivedRequiredProp: requiredProp,
                credential: credentialData ? { username: credentialData.username } : "No credential loaded",
            },
        });
    }
    return [returnData];
  },
};
