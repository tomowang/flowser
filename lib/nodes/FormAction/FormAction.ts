import { browser } from "#imports";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../../types";
import { TextCursorInput } from "@lucide/vue";

interface IFormFieldDefinition {
  selectorType?: "css" | "xpath";
  selector: string;
  fieldType?: "text" | "select" | "checkbox" | "radio";
  value?: string;
  checked?: boolean;
}

export const FormAction: INodeType = {
  description: {
    displayName: "Fill Form",
    name: "formAction",
    icon: TextCursorInput,
    group: ["page_action"],
    version: 1,
    description: "Fill in form fields (text, select, checkbox, radio) on a page",
    defaults: {
      name: "Fill Form",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "Tab ID",
        name: "tabId",
        type: "number",
        default: undefined,
        description: "The ID of the tab containing the form.",
        required: true,
      },
      {
        displayName: "Fields",
        name: "fields",
        type: "fixedCollection",
        default: {},
        description: "The form fields to fill",
        options: [
          {
            name: "values",
            displayName: "Fields",
            values: [
              {
                displayName: "Selector Type",
                name: "selectorType",
                type: "options",
                options: [
                  { name: "CSS Selector", value: "css" },
                  { name: "XPath", value: "xpath" },
                ],
                default: "css",
                description: "The type of selector to use",
              },
              {
                displayName: "Selector",
                name: "selector",
                type: "string",
                default: "",
                placeholder: "e.g. #email or //input[@name='email']",
                description: "The selector of the form element to fill",
              },
              {
                displayName: "Field Type",
                name: "fieldType",
                type: "options",
                options: [
                  { name: "Text / Textarea / Password", value: "text" },
                  { name: "Select", value: "select" },
                  { name: "Checkbox", value: "checkbox" },
                  { name: "Radio", value: "radio" },
                ],
                default: "text",
                description: "The type of form field to fill",
                noDataExpression: true,
              },
              {
                displayName: "Value",
                name: "value",
                type: "string",
                default: "",
                placeholder:
                  "Value to fill, option value(s) to select (comma-separated for multi-select), or radio value",
                displayOptions: {
                  show: {
                    fieldType: ["text", "select", "radio"],
                  },
                },
              },
              {
                displayName: "Checked",
                name: "checked",
                type: "boolean",
                default: true,
                description: "Whether the checkbox should be checked",
                displayOptions: {
                  show: {
                    fieldType: ["checkbox"],
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const tabId = this.getNodeParameter("tabId", i, undefined) as number;
      const fieldsConfig = this.getNodeParameter("fields", i, {}) as {
        values?: IFormFieldDefinition[];
      };
      const fieldsArr = fieldsConfig.values || [];

      if (!tabId || isNaN(tabId)) {
        returnData.push({
          json: {
            error: "Invalid Tab ID",
          },
        });
        continue;
      }

      const results: Record<string, unknown>[] = [];

      for (const field of fieldsArr) {
        const selectorType = field.selectorType || "css";
        const selector = field.selector;
        const fieldType = field.fieldType || "text";
        const value = field.value ?? "";
        const checked = field.checked !== undefined ? field.checked : true;

        if (!selector) {
          results.push({
            selector,
            fieldType,
            ok: false,
            error: "Selector is required",
          });
          continue;
        }

        const scriptResult = await browser.scripting.executeScript({
          target: { tabId },
          func: (
            selectorType: string,
            selector: string,
            fieldType: string,
            value: string,
            checked: boolean,
          ) => {
            function getElementsByXPath(xpath: string, parent: Node = document) {
              const results: (Node | null)[] = [];
              const query = document.evaluate(
                xpath,
                parent,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null,
              );
              for (let i = 0, length = query.snapshotLength; i < length; ++i) {
                results.push(query.snapshotItem(i));
              }
              return results;
            }

            function setNativeValue(
              el: HTMLInputElement | HTMLTextAreaElement,
              val: string,
            ) {
              const proto = Object.getPrototypeOf(el);
              const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
              if (descriptor && descriptor.set) {
                descriptor.set.call(el, val);
              } else {
                el.value = val;
              }
            }

            let elements: (Element | Node | null)[] = [];
            if (selectorType === "css") {
              elements = Array.from(document.querySelectorAll(selector));
            } else {
              elements = getElementsByXPath(selector);
            }

            if (elements.length === 0) {
              return { ok: false, error: "Element not found" };
            }

            try {
              if (fieldType === "text") {
                const el = elements[0];
                if (
                  el instanceof HTMLInputElement ||
                  el instanceof HTMLTextAreaElement
                ) {
                  setNativeValue(el, value);
                  el.dispatchEvent(new Event("input", { bubbles: true }));
                  el.dispatchEvent(new Event("change", { bubbles: true }));
                } else {
                  return { ok: false, error: "Element is not an input or textarea" };
                }
              } else if (fieldType === "select") {
                const el = elements[0];
                if (el instanceof HTMLSelectElement) {
                  const values = value
                    .split(",")
                    .map((v) => v.trim())
                    .filter((v) => v.length > 0);
                  if (el.multiple) {
                    Array.from(el.options).forEach((opt) => {
                      opt.selected = values.includes(opt.value);
                    });
                  } else {
                    el.value = values[0] ?? "";
                  }
                  el.dispatchEvent(new Event("change", { bubbles: true }));
                } else {
                  return { ok: false, error: "Element is not a select" };
                }
              } else if (fieldType === "checkbox") {
                const el = elements[0];
                if (el instanceof HTMLInputElement && el.type === "checkbox") {
                  el.checked = checked;
                  el.dispatchEvent(new Event("change", { bubbles: true }));
                } else {
                  return { ok: false, error: "Element is not a checkbox" };
                }
              } else if (fieldType === "radio") {
                let matched = false;
                elements.forEach((node) => {
                  if (node instanceof HTMLInputElement && node.type === "radio") {
                    const shouldCheck = node.value === value;
                    node.checked = shouldCheck;
                    if (shouldCheck) {
                      matched = true;
                      node.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                  }
                });
                if (!matched) {
                  return {
                    ok: false,
                    error: "No radio option matched the given value",
                  };
                }
              } else {
                return { ok: false, error: "Unsupported field type" };
              }
            } catch (err) {
              return {
                ok: false,
                error: err instanceof Error ? err.message : "Unknown error",
              };
            }

            return { ok: true };
          },
          args: [selectorType, selector, fieldType, value, checked],
        });

        const fieldResult = scriptResult?.[0]?.result as
          | { ok: boolean; error?: string }
          | undefined;

        results.push({
          selector,
          fieldType,
          ok: fieldResult?.ok ?? false,
          ...(fieldResult?.error ? { error: fieldResult.error } : {}),
        });
      }

      returnData.push({
        json: {
          tabId,
          results,
        },
      });
    }

    return [returnData];
  },
};
