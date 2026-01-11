import { INodeType } from "../types";
import { CopyPlus } from "lucide-vue-next";

export const TabCreated: INodeType = {
  description: {
    displayName: "Tab Created",
    name: "tabCreated",
    icon: CopyPlus,
    group: ["trigger"],
    version: 1,
    description: "Triggers when a new tab is created",
    defaults: {
      name: "Tab Created",
    },
    inputs: [],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [],
  },
  async execute() {
    return [this.getInputData()];
  },
};
