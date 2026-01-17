import { browser } from "#imports";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";
import { AppWindow } from "lucide-vue-next";

export const WindowClose: INodeType = {
  description: {
    displayName: "Window Close",
    name: "windowClose",
    icon: AppWindow,
    group: ["browser"],
    version: 1,
    description: "Close a specific window",
    defaults: {
      name: "Window Close",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "Window ID",
        name: "windowId",
        type: "string",
        default: "",
        required: true,
        placeholder: "e.g. 123 or {{ $json.windowId }}",
        description: "The ID of the window to close",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const windowIdInput = this.getNodeParameter("windowId", i);
      const windowId = Number(windowIdInput);

      if (windowId && !isNaN(windowId)) {
        try {
          await browser.windows.remove(windowId);
          returnData.push({
            json: {
              closed: true,
              windowId,
            },
          });
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(
              `Failed to close window ${windowId}: ${error.message}`,
            );
          }
          throw new Error(`Failed to close window ${windowId}`);
        }
      } else {
        returnData.push({
          json: {
            closed: false,
            windowIdInput,
          },
        });
      }
    }
    return [returnData];
  },
};
