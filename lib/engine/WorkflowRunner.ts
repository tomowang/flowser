import {
  IWorkflow,
  INodeExecutionData,
  IExecuteFunctions,
  IWorkflowNode,
  IWorkflowExecutionResult,
  IExecutionNodeResult,
} from "../types";
import { Registry } from "../nodes/registry";
import { getQuickJS } from "../services/quickjs";
import { QuickJSContext, QuickJSRuntime } from "quickjs-emscripten";
import { toast } from "vue-sonner";

export class WorkflowRunner {
  private workflow: IWorkflow;
  private executionData: Map<string, INodeExecutionData[]> = new Map();
  private nodeExecutionResults: IExecutionNodeResult[] = [];
  private runtime: QuickJSRuntime | undefined;
  private context: QuickJSContext | undefined;

  constructor(workflow: IWorkflow) {
    this.workflow = workflow;
  }

  async run(
    triggerNodeId?: string,
    triggerData?: INodeExecutionData[],
  ): Promise<IWorkflowExecutionResult> {
    const startTime = Date.now();
    this.nodeExecutionResults = [];

    // Initialize QuickJS
    const quickJS = await getQuickJS();
    this.runtime = quickJS.newRuntime();
    this.context = this.runtime.newContext();
    this.setupGlobalContext();

    // 1. Identify start node
    let startNode: IWorkflowNode | undefined;

    if (triggerNodeId) {
      startNode = this.workflow.nodes.find((n) => n.id === triggerNodeId);
    } else {
      // Find manual trigger
      // In real app, we look for the specific trigger type
      startNode = this.workflow.nodes.find((n) => n.type === "manualTrigger");
    }

    if (!startNode) {
      throw new Error("No trigger node found");
    }

    try {
      await this.executeNode(startNode, triggerData || []);
      return {
        id: crypto.randomUUID(),
        workflowId: this.workflow.id,
        workflowName: this.workflow.name,
        startTime,
        endTime: Date.now(),
        status: "success",
        nodeExecutionResults: this.nodeExecutionResults,
      };
    } catch (e: any) {
      return {
        id: crypto.randomUUID(),
        workflowId: this.workflow.id,
        workflowName: this.workflow.name,
        startTime,
        endTime: Date.now(),
        status: "error",
        nodeExecutionResults: this.nodeExecutionResults,
      };
    } finally {
      this.context?.dispose();
      this.runtime?.dispose();
      this.context = undefined;
      this.runtime = undefined;
    }
  }

  private async executeNode(
    node: IWorkflowNode,
    inputData: INodeExecutionData[],
  ) {
    console.log(`Executing node ${node.id} (${node.type})`);
    const startTime = Date.now();

    // Find node type definition
    const nodeType = Registry.get(node.type);
    if (!nodeType) {
      throw new Error(`Node type ${node.type} not found`);
    }

    // Prepare execution context
    let itemIndex = 0;
    const executionFunctions: IExecuteFunctions = {
      getInputData: () => inputData,
      getNodeParameter: (paramName: string, ...args: any[]) => {
        // Handle optional itemIndex argument
        // getNodeParameter(name, index, fallback)
        // getNodeParameter(name, fallback)
        let index = itemIndex;
        let fallback: any = undefined;

        if (typeof args[0] === "number") {
          index = args[0];
          fallback = args[1];
        } else {
          fallback = args[0];
        }

        // Retrieve from node.data or node.parameters
        // Vue Flow stores custom data in .data
        const value = node.data?.[paramName] ?? fallback;
        if (typeof value === "string") {
          if (value.includes("{{")) {
            return this.evaluateStringWithExpressions(
              value,
              itemIndex,
              inputData,
            );
          }
        }
        return value;
      },
      getConnectedNodes: (inputName: string) => {
        // Find edges connected to this node's targetHandle == inputName
        const edges = this.workflow.edges.filter(
          (e) => e.target === node.id && e.targetHandle === inputName,
        );
        const sourceIds = edges.map((e) => e.source);
        // Return the actual node objects with their type definitions to be useful
        return this.workflow.nodes
          .filter((n) => sourceIds.includes(n.id))
          .map((n) => {
            const nodeType = Registry.get(n.type);
            return {
              id: n.id,
              type: n.type,
              nodeType, // Attach the full node type definition (with execute, supplyData etc)
              data: n.data, // access params
            };
          });
      },
    };

    // Execute
    let outputData: INodeExecutionData[][] = [[]];
    let executeError: any = null;

    try {
      if (nodeType.execute) {
        outputData = await nodeType.execute.call(executionFunctions);
      } else {
        outputData = [[{ json: {} }]];
      }
    } catch (e) {
      console.error("Node execution error", e);
      toast.error("Node execution error", {
        description: (e as any).message || String(e),
      });
      executeError = e;
      throw e;
    } finally {
      const endTime = Date.now();
      this.nodeExecutionResults.push({
        nodeId: node.id,
        nodeName: node.data?.label || nodeType.description.displayName,
        startTime,
        endTime,
        status: executeError ? "error" : "success",
        errorMessage: executeError?.message,
        inputData,
        outputData: outputData[0],
      });
    }

    // Store execution data
    this.executionData.set(node.id, outputData[0]);

    // Find next nodes
    const nextNodes = this.findNextNodes(node.id);
    for (const nextNode of nextNodes) {
      // Pass output 0 to next node (simple linear flow)
      await this.executeNode(nextNode, outputData[0]);
    }
  }

  private findNextNodes(nodeId: string): IWorkflowNode[] {
    // Only follow edges that originate from a 'main' output or are standard flow edges.
    // We assume 'main' is the default flow.
    const edges = this.workflow.edges.filter(
      (e) =>
        e.source === nodeId && (e.sourceHandle === "main" || !e.sourceHandle),
    );
    const targetIds = edges.map((e) => e.target);
    return this.workflow.nodes.filter((n) => targetIds.includes(n.id));
  }

  private setupGlobalContext() {
    if (!this.context) return;

    // Define $() function to lookup other nodes
    const nodeFunc = this.context.newFunction("$", (nodeNameHandle) => {
      const nodeName = this.context!.getString(nodeNameHandle);

      // Find node by name (label)
      const targetNode = this.workflow.nodes.find(
        (n) => (n.data?.label || n.id) === nodeName,
      );
      if (!targetNode) return this.context!.undefined;

      const data = this.executionData.get(targetNode.id) || [];
      const obj = this.context!.newObject();

      // .all()
      const allFunc = this.context!.newFunction("all", () => {
        const jsonString = JSON.stringify(data);
        return this.parseJsonSafe(jsonString);
      });
      this.context!.setProp(obj, "all", allFunc);
      allFunc.dispose();

      // Allow accessing index via global variable
      const indexHandle = this.context!.getProp(
        this.context!.global,
        "$itemIndex",
      );
      const index = this.context!.getNumber(indexHandle);
      indexHandle.dispose();

      const itemData = data[index] || data[0];
      if (itemData) {
        const itemJson = JSON.stringify(itemData);
        const itemValue = this.parseJsonSafe(itemJson);
        this.context!.setProp(obj, "item", itemValue);
        itemValue.dispose();
      }

      return obj;
    });

    this.context.setProp(this.context.global, "$", nodeFunc);
    nodeFunc.dispose();
  }

  private parseJsonSafe(jsonString: string) {
    if (!this.context) throw new Error("Context not initialized");
    const jsonHandle = this.context.newString(jsonString);
    const parseHandle = this.context.getProp(this.context.global, "JSON");
    const parseFunc = this.context.getProp(parseHandle, "parse");
    const result = this.context.callFunction(
      parseFunc,
      parseHandle,
      jsonHandle,
    );

    jsonHandle.dispose();
    parseHandle.dispose();
    parseFunc.dispose();

    if (result.error) {
      result.error.dispose();
      return this.context.undefined;
    }
    return result.value;
  }

  private evaluateStringWithExpressions(
    text: string,
    itemIndex: number,
    inputData: INodeExecutionData[],
  ): any {
    const rootRegex = /^\s*{{\s*([\s\S]+?)\s*}}\s*$/;
    const match = text.match(rootRegex);
    if (match) {
      return this.evaluateExpression(match[1], itemIndex, inputData);
    }

    return text.replace(/{{\s*([\s\S]+?)\s*}}/g, (_, expr) => {
      const result = this.evaluateExpression(expr, itemIndex, inputData);
      if (typeof result === "object") return JSON.stringify(result);
      return String(result);
    });
  }

  private evaluateExpression(
    expression: string,
    itemIndex: number,
    inputData: INodeExecutionData[],
  ): any {
    if (!this.context) return expression;

    try {
      const indexHandle = this.context.newNumber(itemIndex);
      this.context.setProp(this.context.global, "$itemIndex", indexHandle);
      indexHandle.dispose();

      const inputObj = this.context.newObject();

      // $input.all()
      const allFunc = this.context.newFunction("all", () => {
        const json = JSON.stringify(inputData);
        return this.parseJsonSafe(json);
      });
      this.context.setProp(inputObj, "all", allFunc);
      allFunc.dispose();

      // $input.item & $json
      if (inputData[itemIndex]) {
        const itemJson = JSON.stringify(inputData[itemIndex]);
        const itemValue = this.parseJsonSafe(itemJson);
        this.context.setProp(inputObj, "item", itemValue);
        itemValue.dispose();

        // $json
        const jsonPart = inputData[itemIndex].json;
        const jsonPartString = JSON.stringify(jsonPart);
        const jsonPartValue = this.parseJsonSafe(jsonPartString);
        this.context.setProp(this.context.global, "$json", jsonPartValue);
        jsonPartValue.dispose();
      } else {
        // Ensure $json is at least an empty object if no input
        const emptyObj = this.context.newObject();
        this.context.setProp(this.context.global, "$json", emptyObj);
        emptyObj.dispose();
      }

      this.context.setProp(this.context.global, "$input", inputObj);
      inputObj.dispose();

      // Eval
      const resultHandle = this.context.evalCode(expression);
      if (resultHandle.error) {
        const error = this.context.dump(resultHandle.error);
        resultHandle.error.dispose();
        console.warn(`Expression evaluation failed: ${expression}`, error);
        toast.warning(`Expression evaluation failed: ${expression}`, {
          description: error?.message || String(error),
        });
        return expression;
      }

      const result = this.context.dump(resultHandle.value);
      resultHandle.value.dispose();
      return result;
    } catch (e: any) {
      console.error("Expression evaluation error", e);
      toast.error("Expression evaluation error", {
        description: e.message || String(e),
      });
      return expression;
    }
  }
}
