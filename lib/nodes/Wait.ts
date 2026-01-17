import { INodeType, INodeExecutionData } from "../types";
import { Clock } from "lucide-vue-next";

export const Wait: INodeType = {
  description: {
    displayName: "Wait",
    name: "wait",
    icon: Clock,
    group: ["utils"],
    version: 1,
    description: "Waits for a specified amount of time",
    defaults: {
      name: "Wait",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "Seconds",
        name: "seconds",
        type: "string",
        default: "1",
        description: "The number of seconds to wait",
      },
    ],
  },
  async execute() {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const secondsStr = this.getNodeParameter("seconds", i) as string;
      const seconds = parseFloat(secondsStr);

      if (isNaN(seconds) || seconds < 0) {
        throw new Error(`Invalid seconds value: ${secondsStr}`);
      }

      await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
      returnData.push(items[i]);
    }

    return [returnData];
  },
};
