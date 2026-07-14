import { browser } from "#imports";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../../types";
import { Group } from "@lucide/vue";

export const TabGroupAction: INodeType = {
  description: {
    displayName: "Tab Group Action",
    name: "tabGroupAction",
    icon: Group,
    group: ["browser"],
    version: 1,
    description: "Perform actions on browser tab groups",
    defaults: {
      name: "Tab Group Action",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "Action",
        name: "action",
        type: "options",
        options: [{ name: "Create", value: "create" }],
        default: "create",
        description: "The action to perform",
        noDataExpression: true,
      },
      // Create options
      {
        displayName: "Tab IDs",
        name: "tabIds",
        type: "string",
        default: "",
        placeholder: "e.g. 123, 456 or {{ $json.tabId }}",
        description:
          "The ID(s) of the tab(s) to add to the new group. Separated by comma for multiple IDs.",
        displayOptions: {
          show: {
            action: ["create"],
          },
        },
      },
      {
        displayName: "Window ID",
        name: "windowId",
        type: "number",
        default: undefined,
        description: "The ID of the window to create the group in",
        displayOptions: {
          show: {
            action: ["create"],
          },
        },
      },
      {
        displayName: "Title",
        name: "title",
        type: "string",
        default: "",
        description: "The title to give the new tab group",
        displayOptions: {
          show: {
            action: ["create"],
          },
        },
      },
      {
        displayName: "Color",
        name: "color",
        type: "options",
        options: [
          { name: "Grey", value: "grey" },
          { name: "Blue", value: "blue" },
          { name: "Red", value: "red" },
          { name: "Yellow", value: "yellow" },
          { name: "Green", value: "green" },
          { name: "Pink", value: "pink" },
          { name: "Purple", value: "purple" },
          { name: "Cyan", value: "cyan" },
          { name: "Orange", value: "orange" },
        ],
        default: "grey",
        description: "The color of the new tab group",
        displayOptions: {
          show: {
            action: ["create"],
          },
        },
      },
      {
        displayName: "Collapsed",
        name: "collapsed",
        type: "boolean",
        default: false,
        description: "Whether the new tab group should be collapsed",
        displayOptions: {
          show: {
            action: ["create"],
          },
        },
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const action = this.getNodeParameter("action", i) as string;

      if (action === "create") {
        const tabIdsInput = this.getNodeParameter("tabIds", i);
        const windowId = this.getNodeParameter("windowId", i) as number;
        const title = this.getNodeParameter("title", i) as string;
        const color = this.getNodeParameter("color", i) as string;
        const collapsed = this.getNodeParameter("collapsed", i) as boolean;

        let tabIds: number[] = [];

        if (Array.isArray(tabIdsInput)) {
          tabIds = tabIdsInput.map((id) => Number(id));
        } else if (typeof tabIdsInput === "string") {
          tabIds = tabIdsInput
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id.length > 0)
            .map((id) => Number(id))
            .filter((id) => !isNaN(id));
        } else if (typeof tabIdsInput === "number") {
          tabIds = [tabIdsInput];
        }

        if (tabIds.length === 0) {
          returnData.push({
            json: {
              error: "No valid Tab IDs provided",
            },
          });
          continue;
        }

        const groupOptions: Record<string, unknown> = { tabIds };

        if (typeof windowId === "number" && !isNaN(windowId)) {
          groupOptions.createProperties = { windowId };
        }

        try {
          const groupId = await browser.tabs.group(
            groupOptions as unknown as Parameters<typeof browser.tabs.group>[0],
          );

          const updateProperties: Record<string, unknown> = { collapsed };

          if (title) {
            updateProperties.title = title;
          }

          if (color) {
            updateProperties.color = color;
          }

          const group = await browser.tabGroups.update(
            groupId,
            updateProperties as unknown as Parameters<
              typeof browser.tabGroups.update
            >[1],
          );

          returnData.push({
            json: {
              ...(group as unknown as Record<string, unknown>),
            },
          });
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(`Failed to create tab group: ${error.message}`);
          }
          throw new Error(`Failed to create tab group`);
        }
      }
    }
    return [returnData];
  },
};
