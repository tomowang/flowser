import { browser } from "#imports";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";
import { Plus } from "lucide-vue-next";

export const TabCreate: INodeType = {
  description: {
    displayName: "Tab Create",
    name: "tabCreate",
    icon: Plus,
    group: ["browser"],
    version: 1,
    description: "Create a new tab",
    defaults: {
      name: "Tab Create",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "URL",
        name: "url",
        type: "string",
        default: "",
        description: "The URL to navigate the tab to",
      },
      {
        displayName: "Active",
        name: "active",
        type: "boolean",
        default: true,
        description: "Whether the tab should become the active tab in the window",
      },
      {
        displayName: "Pinned",
        name: "pinned",
        type: "boolean",
        default: false,
        description: "Whether the tab should be pinned",
      },
      {
        displayName: "Window ID",
        name: "windowId",
        type: "string",
        default: "",
        description: "The ID of the window to create the tab in",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        const url = this.getNodeParameter("url", i) as string;
        const active = this.getNodeParameter("active", i) as boolean;
        const pinned = this.getNodeParameter("pinned", i) as boolean;
        const windowIdInput = this.getNodeParameter("windowId", i) as string;

        const createProperties: any = {
            active,
            pinned,
        };

        if (url) {
            createProperties.url = url;
        }

        if (windowIdInput) {
            const windowId = parseInt(windowIdInput, 10);
             if (!isNaN(windowId)) {
                createProperties.windowId = windowId;
            }
        }

        try {
            const tab = await browser.tabs.create(createProperties);
            returnData.push({
                json: {
                    ...tab,
                },
            });
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create tab: ${error.message}`);
            }
            throw new Error(`Failed to create tab`);
        }
    }
    return [returnData];
  },
};
