import { browser } from "#imports";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../../types";
import { Layers } from "lucide-vue-next";

export const TabAction: INodeType = {
  description: {
    displayName: "Tab Action",
    name: "tabAction",
    icon: Layers,
    group: ["browser"],
    version: 1,
    description: "Create or close tabs",
    defaults: {
      name: "Tab Action",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "Action",
        name: "action",
        type: "options",
        options: [
          { name: "Create", value: "create" },
          { name: "Close", value: "close" },
          { name: "Group", value: "group" },
        ],
        default: "create",
        description: "The action to perform",
        noDataExpression: true,
      },
      // Create options
      {
        displayName: "URL",
        name: "url",
        type: "string",
        default: "",
        description: "The URL to navigate the tab to",
        displayOptions: {
          show: {
            action: ["create"],
          },
        },
      },
      {
        displayName: "Active",
        name: "active",
        type: "boolean",
        default: true,
        description:
          "Whether the tab should become the active tab in the window",
        displayOptions: {
          show: {
            action: ["create"],
          },
        },
      },
      {
        displayName: "Pinned",
        name: "pinned",
        type: "boolean",
        default: false,
        description: "Whether the tab should be pinned",
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
        description: "The ID of the window to create the tab in",
        displayOptions: {
          show: {
            action: ["create", "group"],
          },
        },
      },
      // Group options
      {
        displayName: "Tab IDs",
        name: "tabIds",
        type: "string",
        default: "",
        placeholder: "e.g. 123, 456 or {{ $json.tabId }}",
        description:
          "The ID(s) of the tab(s) to group. Separated by comma for multiple IDs.",
        displayOptions: {
          show: {
            action: ["group"],
          },
        },
      },
      {
        displayName: "Group ID",
        name: "groupId",
        type: "number",
        default: undefined,
        description: "The ID of the group to add the tabs to",
        displayOptions: {
          show: {
            action: ["group"],
          },
        },
      },
      // Close options
      {
        displayName: "Tab ID",
        name: "tabId",
        type: "number",
        default: undefined,
        placeholder: "e.g. 12345 or {{ $json.tabId }}",
        description: "The ID of the tab to close (number or expression)",
        displayOptions: {
          show: {
            action: ["close"],
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
        const url = this.getNodeParameter("url", i) as string;
        const active = this.getNodeParameter("active", i) as boolean;
        const pinned = this.getNodeParameter("pinned", i) as boolean;
        const windowId = this.getNodeParameter("windowId", i) as number;

        const createProperties: any = {
          active,
          pinned,
        };

        if (url) {
          createProperties.url = url;
        }

        if (typeof windowId === "number" && !isNaN(windowId)) {
          createProperties.windowId = windowId;
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
      } else if (action === "close") {
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
          // If tabId is invalid or not provided, we might want to return something or error
          // The original code pushed a result even if invalid id?
          // "if (tabId && !isNaN(tabId)) { ... } else { returnData.push(...) }"
          // Let's match original behavior.
          returnData.push({
            json: {
              closed: false,
              tabIdInput,
              error: "Invalid Tab ID",
            },
          });
        }
      } else if (action === "group") {
        const tabIdsInput = this.getNodeParameter("tabIds", i);
        const groupId = this.getNodeParameter("groupId", i) as number;
        const windowId = this.getNodeParameter("windowId", i) as number;

        let tabIds: number[] = [];

        if (Array.isArray(tabIdsInput)) {
          tabIds = tabIdsInput.map((id) => Number(id));
        } else if (typeof tabIdsInput === "string") {
          tabIds = tabIdsInput
            .split(",")
            .map((id) => Number(id.trim()))
            .filter((id) => !isNaN(id));
        } else if (typeof tabIdsInput === "number") {
          tabIds = [tabIdsInput];
        }

        if (tabIds.length > 0) {
          const groupOptions: any = {
            tabIds,
          };

          if (typeof groupId === "number" && !isNaN(groupId)) {
            groupOptions.groupId = groupId;
          }

          if (typeof windowId === "number" && !isNaN(windowId)) {
            groupOptions.createProperties = {
              windowId,
            };
          }

          try {
            const newGroupId = await browser.tabs.group(groupOptions);
            returnData.push({
              json: {
                groupId: newGroupId,
                tabIds,
              },
            });
          } catch (error) {
            if (error instanceof Error) {
              throw new Error(`Failed to group tabs: ${error.message}`);
            }
            throw new Error(`Failed to group tabs`);
          }
        } else {
          returnData.push({
            json: {
              error: "No valid Tab IDs provided",
            },
          });
        }
      }
    }
    return [returnData];
  },
};
