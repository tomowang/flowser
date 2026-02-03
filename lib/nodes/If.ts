import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";
import { Split } from "lucide-vue-next";

interface Condition {
  key: string;
  operator: string;
  value: string;
}

export const If: INodeType = {
  description: {
    displayName: "If",
    name: "if",
    icon: Split,
    group: ["core"],
    version: 1,
    description: "Splits a flow conditionally",
    defaults: {
      name: "If",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [
      { name: "true", type: "main", label: "True" },
      { name: "false", type: "main", label: "False" },
    ],
    properties: [
      {
        displayName: "Combinator",
        name: "combinator",
        type: "options",
        options: [
          { name: "All (AND)", value: "all" },
          { name: "Any (OR)", value: "any" },
        ],
        default: "all",
        description: "How to combine multiple conditions",
      },
      {
        displayName: "Conditions",
        name: "conditions",
        type: "json",
        default: "[]",
        description:
          'Array of conditions. Example: [{"key": "{{$json.value}}", "operator": "==", "value": "test"}]',
        // Note: Ideally this would be a 'collection' or 'fixed' custom UI type if available,
        // but based on current types we use JSON as fallback.
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnDataTrue: INodeExecutionData[] = [];
    const returnDataFalse: INodeExecutionData[] = [];

    // Helper to evaluate expressions if available
    const evaluate = (expr: any, index: number): any => {
      if (typeof expr === "string" && this.evaluateExpression) {
        return this.evaluateExpression(expr, index);
      }
      return expr;
    };

    for (let i = 0; i < items.length; i++) {
      const combinator = this.getNodeParameter("combinator", i) as string;
      const conditionsStr = this.getNodeParameter("conditions", i) as string;

      let conditions: Condition[] = [];
      try {
        if (typeof conditionsStr === "string") {
          conditions = JSON.parse(conditionsStr);
        } else {
          conditions = conditionsStr;
        }
      } catch (e) {
        console.warn("Invalid conditions JSON", conditionsStr);
      }

      if (!Array.isArray(conditions)) {
        conditions = [];
      }

      let result = true;

      if (conditions.length === 0) {
        result = true;
      } else {
        if (combinator === "all") {
          result = true;
          for (const cond of conditions) {
            const key = evaluate(cond.key, i);
            const value = evaluate(cond.value, i);
            if (!evaluateConditionResult(key, cond.operator, value)) {
              result = false;
              break;
            }
          }
        } else {
          // any
          result = false;
          for (const cond of conditions) {
            const key = evaluate(cond.key, i);
            const value = evaluate(cond.value, i);
            if (evaluateConditionResult(key, cond.operator, value)) {
              result = true;
              break;
            }
          }
        }
      }

      if (result) {
        returnDataTrue.push(items[i]);
      } else {
        returnDataFalse.push(items[i]);
      }
    }

    return [returnDataTrue, returnDataFalse];
  },
};

function evaluateConditionResult(
  key: any,
  operator: string,
  value: any,
): boolean {
  // Simple type coercion comparison
  const valueNum = Number(value);
  const keyNum = Number(key);
  // Check if both are valid numbers.
  // Note: Empty string becomes 0 with Number(), so we check explicitly.
  const isNum =
    !isNaN(valueNum) &&
    !isNaN(keyNum) &&
    (typeof value !== "string" || value.trim() !== "") &&
    (typeof key !== "string" || key.trim() !== "");

  switch (operator) {
    case "==":
      return key == value; // loose equality
    case "!=":
      return key != value;
    case ">":
      return isNum ? keyNum > valueNum : key > value;
    case "<":
      return isNum ? keyNum < valueNum : key < value;
    case ">=":
      return isNum ? keyNum >= valueNum : key >= value;
    case "<=":
      return isNum ? keyNum <= valueNum : key <= value;
    case "contains":
      return String(key).includes(String(value));
    case "startsWith":
      return String(key).startsWith(String(value));
    case "endsWith":
      return String(key).endsWith(String(value));
    default:
      return false;
  }
}
