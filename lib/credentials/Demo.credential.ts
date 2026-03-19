import type { ICredentialType } from "../types";
import { FlaskConical } from "lucide-vue-next";

export const DemoCredential: ICredentialType = {
  name: "demo_credential",
  displayName: "Demo Credential",
  icon: FlaskConical,
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
      type: "password",
      default: "password",
      description: "This is a demo password",
    },
  ],
};
