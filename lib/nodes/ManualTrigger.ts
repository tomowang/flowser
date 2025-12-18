import { INodeType, INodeExecutionData } from "../types";

export const ManualTrigger: INodeType = {
  description: {
    displayName: "Manual Trigger",
    name: "manualTrigger",
    icon: "fa:hand-pointer-o",
    group: ["trigger"],
    version: 1,
    description: "Triggers the workflow manually",
    defaults: {
      name: "Manual Trigger",
      color: "#ff6d5a",
    },
    inputs: [],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [],
  },
  async execute() {
    // Manual trigger simply passes an empty item to start the flow
    return [[{ json: {} }]];
  },
};
