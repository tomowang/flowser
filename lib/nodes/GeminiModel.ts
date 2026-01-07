import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";
import { CredentialService } from "../services/credential-service";
import { Sparkles } from "lucide-vue-next";

export const GeminiModel: INodeType = {
  description: {
    displayName: "Gemini Chat Model",
    name: "geminiModel",
    icon: Sparkles,
    group: ["model"],
    version: 1,
    description: "Google Gemini LLM Model",
    defaults: {
      name: "Gemini Model",
    },
    inputs: [],
    outputs: [{ name: "model", type: "model", label: "Model" }],
    properties: [
      {
        displayName: "Credential",
        name: "credentialId",
        type: "credential",
        credentialType: "gemini_api",
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
