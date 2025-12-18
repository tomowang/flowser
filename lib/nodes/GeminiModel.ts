import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";
import { CredentialService } from "../services/credential-service";

export const GeminiModel: INodeType = {
  description: {
    displayName: "Gemini Chat Model",
    name: "geminiModel",
    icon: "fa:google",
    group: ["model"],
    version: 1,
    description: "Google Gemini LLM Model",
    defaults: {
      name: "Gemini Model",
      color: "#4285f4",
    },
    inputs: [],
    outputs: [{ name: "model", type: "model", label: "Model" }],
    properties: [
      {
        displayName: "Credential",
        name: "credentialId",
        type: "options",
        options: [], // Will be populated dynamically in UI mostly, but here we define the structure
        // In a real app, the UI would fetch options. For now, we rely on the user pasting an ID or we improve the UI.
        // Actually, let's just make it a string input for ID if we can't do dynamic options easily yet.
        // Or better, let's keep it 'string' but labeled "Credential ID (copy from settings)".
        // Ideally: type: 'credential', credentialType: 'gemini_api'
        default: "",
        description: "Select the credential to use",
      },
      {
        displayName: "Model Name",
        name: "modelName",
        type: "options",
        options: [
          { name: "Gemini Pro", value: "gemini-pro" },
          { name: "Gemini Pro Vision", value: "gemini-pro-vision" },
        ],
        default: "gemini-pro",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Models typically don't execute on their own in this architecture (like Tools).
    // They are called by the Agent.
    return [[]];
  },
};
