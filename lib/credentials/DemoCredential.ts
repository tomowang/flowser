import type { ICredentialType } from "../types";

export const DemoCredential: ICredentialType = {
  name: "demo_credential",
  displayName: "Demo Credential",
  properties: [
    {
      displayName: "Username",
      name: "username",
      type: "string",
      default: "admin",
    },
    {
      displayName: "Password",
      name: "password",
      type: "string",
      default: "password",
      description: "This is a demo password",
    },
  ],
};
