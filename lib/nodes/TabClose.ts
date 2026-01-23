import { browser } from "#imports";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";
import { CopyX } from "lucide-vue-next";

export const TabClose: INodeType = {
  description: {
    displayName: "Tab Close",
    name: "tabClose",
    icon: CopyX,
    group: ["browser"],
    version: 1,
    description: "Close a specific tab",
    defaults: {
      name: "Tab Close",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "Tab ID",
        name: "tabId",
        type: "number",
        default: undefined,
        required: true,
        placeholder: "e.g. 12345 or {{ $json.tabId }}",
        description: "The ID of the tab to close (number or expression)",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const tabIdInput = this.getNodeParameter("tabId", i);
      const tabId = Number(tabIdInput);

      if (tabId && !isNaN(tabId)) {
        try {
          await browser.tabs.remove(tabId);
          returnData.push({
            json: {
              closed: true,
              tabId,
            },
          });
        } catch (error) {
          console.warn(`Failed to close tab ${tabId}`, error);
          if (error instanceof Error) {
            throw new Error(`Failed to close tab ${tabId}: ${error.message}`);
          }
          throw new Error(`Failed to close tab ${tabId}`);
        }
      } else {
        returnData.push({
          json: {
            closed: false,
            tabIdInput,
          },
        });
      }
    }
    return [returnData];
  },
};
