import { browser } from "#imports";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../../types";
import { AppWindow } from "lucide-vue-next";

export const WindowCreate: INodeType = {
  description: {
    displayName: "Window Create",
    name: "windowCreate",
    icon: AppWindow,
    group: ["browser"],
    version: 1,
    description: "Create a new window",
    defaults: {
      name: "Window Create",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "URL",
        name: "url",
        type: "string",
        default: "",
        description: "The URL to navigate the window to",
      },
      {
        displayName: "Type",
        name: "type",
        type: "options",
        options: [
          { name: "Normal", value: "normal" },
          { name: "Popup", value: "popup" },
          { name: "Panel", value: "panel" },
        ],
        default: "normal",
        description: "The type of window to create",
      },
      {
        displayName: "State",
        name: "state",
        type: "options",
        options: [
          { name: "Normal", value: "normal" },
          { name: "Minimized", value: "minimized" },
          { name: "Maximized", value: "maximized" },
          { name: "Fullscreen", value: "fullscreen" },
        ],
        default: "normal",
        description: "The initial state of the window",
      },
      {
        displayName: "Focused",
        name: "focused",
        type: "boolean",
        default: true,
        description: "Whether the window should be focused",
      },
      {
        displayName: "Incognito",
        name: "incognito",
        type: "boolean",
        default: false,
        description: "Whether the window should be incognito",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const url = this.getNodeParameter("url", i) as string;
      const type = this.getNodeParameter("type", i) as
        | "normal"
        | "popup"
        | "panel";
      const state = this.getNodeParameter("state", i) as
        | "normal"
        | "minimized"
        | "maximized"
        | "fullscreen";
      const focused = this.getNodeParameter("focused", i) as boolean;
      const incognito = this.getNodeParameter("incognito", i) as boolean;

      const createData: any = {
        type,
        state,
        focused,
        incognito,
      };

      if (url) {
        createData.url = url;
      }

      try {
        const window = await browser.windows.create(createData);
        returnData.push({
          json: {
            ...window,
          },
        });
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to create window: ${error.message}`);
        }
        throw new Error(`Failed to create window`);
      }
    }
    return [returnData];
  },
};
