import { INodeType, IExecuteFunctions, INodeExecutionData } from "../../types";
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
        type: "fixedCollection",
        default: {},
        options: [
          {
            name: "values",
            displayName: "Values",
            values: [
              {
                displayName: "Name",
                name: "name",
                type: "string",
                default: "",
                placeholder: "Field Name",
                description: "The name of the field to set",
              },
              {
                displayName: "Type",
                name: "type",
                type: "options",
                options: [
                  { name: "String", value: "string" },
                  { name: "Number", value: "number" },
                  { name: "Boolean", value: "boolean" },
                  { name: "JSON", value: "json" },
                ],
                default: "string",
                description: "The type of the field value",
              },
              {
                displayName: "Value",
                name: "stringValue",
                type: "string",
                default: "",
                placeholder: "Field Value",
                displayOptions: {
                  show: {
                    type: ["string"],
                  },
                },
              },
              {
                displayName: "Value",
                name: "numberValue",
                type: "number",
                default: 0,
                placeholder: "Field Value",
                displayOptions: {
                  show: {
                    type: ["number"],
                  },
                },
              },
              {
                displayName: "Value",
                name: "booleanValue",
                type: "options",
                options: [
                  { name: "True", value: "true" },
                  { name: "False", value: "false" },
                ],
                default: "false",
                displayOptions: {
                  show: {
                    type: ["boolean"],
                  },
                },
              },
              {
                displayName: "Value",
                name: "jsonValue",
                type: "json",
                default: "{}",
                displayOptions: {
                  show: {
                    type: ["json"],
                  },
                },
              },
            ],
          },
        ],
        description: "The fields to set in the output item",
      },
    ],
  },

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const mode = this.getNodeParameter("mode", i) as string;
      const fieldsArr = (this.getNodeParameter("fields", i) as any)
        ?.values as any[];

      let fields: Record<string, any> = {};

      if (fieldsArr) {
        for (const field of fieldsArr) {
          const name = field.name;
          const type = field.type;

          if (type === "string") {
            fields[name] = field.stringValue;
          } else if (type === "number") {
            fields[name] = field.numberValue;
          } else if (type === "boolean") {
            fields[name] = field.booleanValue === "true";
          } else if (type === "json") {
            try {
              fields[name] = JSON.parse(field.jsonValue);
            } catch (e) {
              console.warn("Invalid JSON in Edit Fields node", field.jsonValue);
              fields[name] = field.jsonValue;
            }
          }
        }
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
