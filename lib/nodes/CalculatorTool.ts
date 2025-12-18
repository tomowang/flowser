import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";

export const CalculatorTool: INodeType = {
  description: {
    displayName: "Calculator",
    name: "calculatorTool",
    icon: "fa:calculator",
    group: ["tool"],
    version: 1,
    description: "A simple calculator tool for Agents",
    defaults: {
      name: "Calculator",
      color: "#ff9800", // Orange
    },
    inputs: [],
    outputs: [{ name: "tool", type: "tool", label: "Tool" }],
    properties: [
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        options: [
          { name: "Add", value: "add" },
          { name: "Subtract", value: "sub" },
          { name: "Multiply", value: "mul" },
          { name: "Divide", value: "div" },
        ],
        default: "add",
      },
    ],
  },
  // Tools often don't execute in the main flow, but we can define a method to be called by the Agent
  // For now, let's assume the Agent calls `execute()` or a specific method if we extend the interface.
  // We'll stick to a convention where the Agent manually invokes logic found here.

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // In a real system, the tool execution might happen here when triggered by the agent.
    // For this sample, we'll assume the inputs come from the Agent, not the flow.
    return [[]];
  },
};
