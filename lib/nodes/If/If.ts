import { INodeType, IExecuteFunctions, INodeExecutionData } from "../../types";
import {
  Split,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  List,
  Box,
} from "lucide-vue-next";

interface Condition {
  value: unknown;
  operator: string;
  targetValue: unknown;
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
              operator: "string:equal",
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
                  {
                    name: "String",
                    icon: Type,
                    children: [
                      { name: "is equal to", value: "string:equal" },
                      { name: "is not equal to", value: "string:notEqual" },
                      { name: "contains", value: "string:contains" },
                      { name: "does not contain", value: "string:notContains" },
                      { name: "starts with", value: "string:startsWith" },
                      { name: "ends with", value: "string:endsWith" },
                      { name: "matches regex", value: "string:regex" },
                      {
                        name: "does not match regex",
                        value: "string:notRegex",
                      },
                      { name: "is empty", value: "string:isEmpty" },
                      { name: "is not empty", value: "string:isNotEmpty" },
                    ],
                  },
                  {
                    name: "Number",
                    icon: Hash,
                    children: [
                      { name: "is equal to", value: "number:equal" },
                      { name: "is not equal to", value: "number:notEqual" },
                      { name: "is greater than", value: "number:larger" },
                      {
                        name: "is greater than or equal",
                        value: "number:largerEqual",
                      },
                      { name: "is less than", value: "number:smaller" },
                      {
                        name: "is less than or equal",
                        value: "number:smallerEqual",
                      },
                      { name: "is empty", value: "number:isEmpty" },
                      { name: "is not empty", value: "number:isNotEmpty" },
                    ],
                  },
                  {
                    name: "Date & Time",
                    icon: Calendar,
                    children: [
                      { name: "is after", value: "dateTime:after" },
                      { name: "is before", value: "dateTime:before" },
                      { name: "is equal to", value: "dateTime:equal" },
                      { name: "is not equal to", value: "dateTime:notEqual" },
                      { name: "is empty", value: "dateTime:isEmpty" },
                      { name: "is not empty", value: "dateTime:isNotEmpty" },
                    ],
                  },
                  {
                    name: "Boolean",
                    icon: CheckSquare,
                    children: [
                      { name: "is true", value: "boolean:true" },
                      { name: "is false", value: "boolean:false" },
                      { name: "is equal to", value: "boolean:equal" },
                      { name: "is not equal to", value: "boolean:notEqual" },
                    ],
                  },
                  {
                    name: "Array",
                    icon: List,
                    children: [
                      { name: "contains", value: "array:contains" },
                      { name: "does not contain", value: "array:notContains" },
                      { name: "is empty", value: "array:isEmpty" },
                      { name: "is not empty", value: "array:isNotEmpty" },
                    ],
                  },
                  {
                    name: "Object",
                    icon: Box,
                    children: [
                      { name: "is empty", value: "object:isEmpty" },
                      { name: "is not empty", value: "object:isNotEmpty" },
                    ],
                  },
                ],
                default: "string:equal",
                colSpan: 1,
              },
              {
                displayName: "Target Value",
                name: "targetValue",
                type: "string",
                displayOptions: {
                  hide: {
                    operator: [
                      "string:isEmpty",
                      "string:isNotEmpty",
                      "number:isEmpty",
                      "number:isNotEmpty",
                      "boolean:true",
                      "boolean:false",
                      "dateTime:isEmpty",
                      "dateTime:isNotEmpty",
                      "array:isEmpty",
                      "array:isNotEmpty",
                      "object:isEmpty",
                      "object:isNotEmpty",
                    ],
                  },
                },
                default: "",
                colSpan: 2,
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
            if (!evaluateCondition(cond)) {
              result = false;
              break;
            }
          }
        } else {
          // any
          result = false;
          for (const cond of conditions) {
            if (evaluateCondition(cond)) {
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

function evaluateCondition(condition: Condition): boolean {
  const { value, operator, targetValue } = condition;
  const [type, op] = operator.split(":");

  switch (type) {
    case "string":
      return evaluateString(String(value ?? ""), op, String(targetValue ?? ""));
    case "number":
      return evaluateNumber(Number(value), op, Number(targetValue));
    case "boolean":
      return evaluateBoolean(value, op, targetValue);
    case "dateTime":
      return evaluateDateTime(value, op, targetValue);
    case "array":
      return evaluateArray(value, op, targetValue);
    case "object":
      return evaluateObject(value, op);
    default:
      return false;
  }
}

function evaluateString(val1: string, operator: string, val2: string): boolean {
  switch (operator) {
    case "equal":
      return val1 === val2;
    case "notEqual":
      return val1 !== val2;
    case "contains":
      return val1.includes(val2);
    case "notContains":
      return !val1.includes(val2);
    case "startsWith":
      return val1.startsWith(val2);
    case "endsWith":
      return val1.endsWith(val2);
    case "regex":
      try {
        return new RegExp(val2).test(val1);
      } catch {
        return false;
      }
    case "notRegex":
      try {
        return !new RegExp(val2).test(val1);
      } catch {
        return false;
      }
    case "isEmpty":
      return val1 === "";
    case "isNotEmpty":
      return val1 !== "";
    default:
      return false;
  }
}

function evaluateNumber(val1: number, operator: string, val2: number): boolean {
  switch (operator) {
    case "equal":
      return val1 === val2;
    case "notEqual":
      return val1 !== val2;
    case "larger":
      return val1 > val2;
    case "largerEqual":
      return val1 >= val2;
    case "smaller":
      return val1 < val2;
    case "smallerEqual":
      return val1 <= val2;
    case "isEmpty":
      return isNaN(val1);
    case "isNotEmpty":
      return !isNaN(val1);
    default:
      return false;
  }
}

function evaluateBoolean(
  val1: unknown,
  operator: string,
  val2: unknown,
): boolean {
  const b1 = !!val1;
  const b2 = !!val2;

  switch (operator) {
    case "true":
      return b1 === true;
    case "false":
      return b1 === false;
    case "equal":
      return b1 === b2;
    case "notEqual":
      return b1 !== b2;
    default:
      return false;
  }
}

function evaluateDateTime(
  val1: unknown,
  operator: string,
  val2: unknown,
): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d1 = new Date(val1 as any).getTime();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d2 = new Date(val2 as any).getTime();

  if (operator !== "isEmpty" && operator !== "isNotEmpty") {
    if (isNaN(d1) || isNaN(d2)) return false;
  } else if (operator === "isEmpty" || operator === "isNotEmpty") {
    if (operator === "isEmpty") return isNaN(d1);
    return !isNaN(d1);
  }

  switch (operator) {
    case "after":
      return d1 > d2;
    case "before":
      return d1 < d2;
    case "equal":
      return d1 === d2;
    case "notEqual":
      return d1 !== d2;
    default:
      return false;
  }
}

function evaluateArray(val1: unknown, operator: string, val2: unknown): boolean {
  if (!Array.isArray(val1)) {
    if (operator === "isEmpty") return val1 === undefined || val1 === null;
    if (operator === "isNotEmpty") return val1 !== undefined && val1 !== null;
    return false;
  }

  switch (operator) {
    case "contains":
      return val1.includes(val2);
    case "notContains":
      return !val1.includes(val2);
    case "isEmpty":
      return val1.length === 0;
    case "isNotEmpty":
      return val1.length > 0;
    default:
      return false;
  }
}

function evaluateObject(val1: unknown, operator: string): boolean {
  if (val1 === null || typeof val1 !== "object" || Array.isArray(val1)) {
    if (operator === "isEmpty") return val1 === undefined || val1 === null;
    if (operator === "isNotEmpty") return val1 !== undefined && val1 !== null;
    return false;
  }

  const keys = Object.keys(val1 as object);

  switch (operator) {
    case "isEmpty":
      return keys.length === 0;
    case "isNotEmpty":
      return keys.length > 0;
    default:
      return false;
  }
}
