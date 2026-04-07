import { INodeType } from "../../types";
import { RefreshCw } from "lucide-vue-next";

export const TabUpdated: INodeType = {
  description: {
    displayName: "Tab Updated",
    name: "tabUpdated",
    icon: RefreshCw,
    group: ["trigger"],
    version: 1,
    description: "Triggers when a tab is updated",
    defaults: {
      name: "Tab Updated",
    },
    inputs: [],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [],
  },
  async execute() {
    return [this.getInputData()];
  },
};
