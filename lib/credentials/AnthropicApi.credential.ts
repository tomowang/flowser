import Claude from "@thesvg/vue/claude";
import type { ICredentialType } from "../types";

export const AnthropicApiCredential: ICredentialType = {
  name: "anthropic_api",
  displayName: "Anthropic API",
  icon: Claude,
  properties: [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "password",
      required: true,
      description: "Anthropic API key",
    },
  ],
  documentationUrl: "https://console.anthropic.com/settings/keys",
};
