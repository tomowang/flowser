import Gemini from "@thesvg/vue/gemini";
import type { ICredentialType } from "../types";

export const GeminiApiCredential: ICredentialType = {
  name: "gemini_api",
  displayName: "Gemini API",
  icon: Gemini,
  properties: [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "password",
      required: true,
      description: "Google AI Gemini API key",
    },
  ],
  documentationUrl: "https://aistudio.google.com/apikey",
};
