import { INodeType, IExecuteFunctions, INodeExecutionData } from "../../types";
import { ArrowRight } from "@lucide/vue";

export const Placeholder: INodeType = {
  description: {
    displayName: "Placeholder",
    name: "placeholder",
    icon: ArrowRight,
    group: ["core"],
    version: 1,
    description:
      "Passes input data through to the output unchanged. Useful as a placeholder while building or testing a workflow.",
    defaults: {
      name: "Placeholder",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    return [this.getInputData()];
  },
};
