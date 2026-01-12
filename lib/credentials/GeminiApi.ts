import type { ICredentialType } from "../types";

export const GeminiApiCredential: ICredentialType = {
  name: "gemini_api",
  displayName: "Gemini API",
  properties: [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      required: true,
      description: "Google AI Gemini API key",
    },
  ],
  documentationUrl: "https://aistudio.google.com/apikey",
};
