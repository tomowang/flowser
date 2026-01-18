import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";
import { Calculator } from "lucide-vue-next";

export const EditFields: INodeType = {
  description: {
    displayName: "Edit Fields",
    name: "editFields",
    icon: Calculator,
    group: ["core"],
    version: 1,
    description: "Edit, add or remove fields from the input items",
    defaults: {
      name: "Edit Fields",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "Mode",
        name: "mode",
        type: "options",
        options: [
          { name: "Mapping (Merge)", value: "mapping" },
          { name: "Keep Only Set", value: "keepOnlySet" },
        ],
        default: "mapping",
        description:
          "Whether to merge new fields with existing ones or keep only the new fields",
      },
      {
        displayName: "Fields",
        name: "fields",
        type: "json",
        default: "{}",
        description: "JSON object mapping field names to values.",
      },
    ],
  },

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const mode = this.getNodeParameter("mode", i) as string;
      const fieldsStr = this.getNodeParameter("fields", i) as string;

      let fields: Record<string, any> = {};
      try {
        if (fieldsStr) {
          fields = JSON.parse(fieldsStr);
        }
      } catch (e) {
        console.warn("Invalid JSON in Edit Fields node", fieldsStr);
      }

      const existingJson = item.json;
      let newJson: Record<string, any>;

      if (mode === "keepOnlySet") {
        newJson = { ...fields };
      } else {
        newJson = { ...existingJson, ...fields };
      }

      returnData.push({
        json: newJson,
        binary: item.binary,
      });
    }

    return [returnData];
  },
};
