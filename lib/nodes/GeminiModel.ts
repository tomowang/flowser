import { INodeType, IExecuteFunctions, INodeExecutionData, SupplyData } from "../types";
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
          { name: "Gemini 2.5 Flash Lite", value: "gemini-2.5-flash-lite" },
          { name: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
          { name: "Gemini 2.5 Pro", value: "gemini-2.5-pro" },
          { name: "Gemini 3.0 Flash Preview", value: "gemini-3-flash-preview"},
          { name: "Gemini 3.0 Pro Preview", value: "gemini-3-pro-preview"}
        ],
        default: "gemini-2.5-flash-lite",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Models typically don't execute on their own in this architecture (like Tools).
    // They are called by the Agent.
    return [[]];
  },
  async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
    const credentialId = this.getNodeParameter("credentialId", itemIndex) as string;
    const modelName = this.getNodeParameter("modelName", itemIndex, "gemini-2.5-flash-lite") as string;

    if (!credentialId) {
      throw new Error("No credential selected for Gemini Model");
    }

    // Dynamic import to avoid issues if service is backend-only, 
    // but here we are in a browser extension context? 
    // The user rules and usage implies this runs in the extension structure (WXT).
    // We previously saw CredentialService import in Agent.ts comments.
    const { CredentialService } = await import("../services/credential-service");
    
    const apiKey = await CredentialService.getDecryptedValue(credentialId);
    if (!apiKey) {
      throw new Error("Failed to decrypt Gemini API key");
    }

    const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
    
    const google = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    // Create and return the model instance
    return {
      response: {
        model: google(modelName),
        provider: "google",
        modelName: modelName,
      },
    };
  },
};
