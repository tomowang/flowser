import { INodeType, IExecuteFunctions, INodeExecutionData } from "../../types";
import { Split } from "lucide-vue-next";

interface Condition {
  value: string;
  operator: string;
  targetValue: string;
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
        type: "fixedCollection",
        default: {
          items: [
            {
              value: "",
              operator: "==",
              targetValue: "",
            },
          ],
        },
        options: [
          {
            name: "items",
            displayName: "Condition",
            values: [
              {
                displayName: "Value",
                name: "value",
                type: "string",
                default: "",
                colSpan: 2,
              },
              {
                displayName: "Operator",
                name: "operator",
                type: "options",
                noDataExpression: true,
                options: [
                  { name: "==", value: "==" },
                  { name: "!=", value: "!=" },
                  { name: ">", value: ">" },
                  { name: "<", value: "<" },
                  { name: ">=", value: ">=" },
                  { name: "<=", value: "<=" },
                  { name: "Contains", value: "contains" },
                  { name: "Starts With", value: "startsWith" },
                  { name: "Ends With", value: "endsWith" },
                ],
                default: "==",
                colSpan: 1,
              },
              {
                displayName: "Target Value",
                name: "targetValue",
                type: "string",
                default: "",
                colSpan: 3,
              },
            ],
          },
        ],
        description: "The conditions to evaluate",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnDataTrue: INodeExecutionData[] = [];
    const returnDataFalse: INodeExecutionData[] = [];

    // Helper to evaluate expressions if available
    const evaluate = (expr: unknown, index: number): unknown => {
      if (typeof expr === "string" && this.evaluateExpression) {
        return this.evaluateExpression(expr, index);
      }
      return expr;
    };

    for (let i = 0; i < items.length; i++) {
      const combinator = this.getNodeParameter("combinator", i) as string;
      const conditionsConfig = this.getNodeParameter("conditions", i, {}) as {
        items?: Condition[];
      };
      const conditions = conditionsConfig.items || [];

      let result = true;

      if (conditions.length === 0) {
        result = true;
      } else {
        if (combinator === "all") {
          result = true;
          for (const cond of conditions) {
            const val1 = evaluate(cond.value, i);
            const val2 = evaluate(cond.targetValue, i);
            if (!evaluateConditionResult(val1, cond.operator, val2)) {
              result = false;
              break;
            }
          }
        } else {
          // any
          result = false;
          for (const cond of conditions) {
            const val1 = evaluate(cond.value, i);
            const val2 = evaluate(cond.targetValue, i);
            if (evaluateConditionResult(val1, cond.operator, val2)) {
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
  key: unknown,
  operator: string,
  value: unknown,
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
      if (isNum) return keyNum > valueNum;
      return String(key) > String(value);
    case "<":
      if (isNum) return keyNum < valueNum;
      return String(key) < String(value);
    case ">=":
      if (isNum) return keyNum >= valueNum;
      return String(key) >= String(value);
    case "<=":
      if (isNum) return keyNum <= valueNum;
      return String(key) <= String(value);
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
