import { INodeType, INodeExecutionData, IExecuteFunctions } from "../../types";
import { Clock } from "lucide-vue-next";

export const ScheduleTrigger: INodeType = {
  description: {
    displayName: "Schedule Trigger",
    name: "scheduleTrigger",
    icon: Clock,
    group: ["trigger"],
    version: 1,
    description: "Triggers the workflow on a schedule (Cron)",
    defaults: {
      name: "Schedule Trigger",
      cron: "0 * * * *", // Default to every hour
    },
    inputs: [],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "Cron Expression",
        name: "cron",
        type: "cron",
        default: "0 * * * *",
        placeholder: "0 * * * *",
        description: "Cron expression for the schedule",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    if (items.length > 0) {
      return [[items[0]]];
    }
    const timestamp = Date.now();
    return [[{ json: { timestamp } }]];
  },
};
