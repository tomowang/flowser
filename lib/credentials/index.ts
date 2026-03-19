import type { ICredentialType } from "../types";

import { GeminiApiCredential } from "./GeminiApi.credential";
import { OpenAIApiCredential } from "./OpenAIApi.credential";
import { AnthropicApiCredential } from "./AnthropicApi.credential";
import { DeepSeekApiCredential } from "./DeepSeekApi.credential";
import { DemoCredential } from "./Demo.credential";

export {
  GeminiApiCredential,
  OpenAIApiCredential,
  AnthropicApiCredential,
  DeepSeekApiCredential,
};

// Registry of all credential types
const credentialTypes: ICredentialType[] = [
  GeminiApiCredential,
  OpenAIApiCredential,
  AnthropicApiCredential,
  DeepSeekApiCredential,
];

if (import.meta.env.DEV) {
  credentialTypes.push(DemoCredential);
}

// Get all registered credential types
export function getAllCredentialTypes(): ICredentialType[] {
  return credentialTypes;
}

// Get a credential type by name
export function getCredentialType(name: string): ICredentialType | undefined {
  return credentialTypes.find((ct) => ct.name === name);
}
