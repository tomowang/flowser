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
import { evaluateParameters } from "./parameter-evaluator";

export type ExecutionStatus = "running" | "success" | "error";

export class WorkflowRunner {
  private workflow: IWorkflow;
  private executionData: Map<string, INodeExecutionData[]> = new Map();
  private nodeExecutionResults: IExecutionNodeResult[] = [];
  private runtime: QuickJSRuntime | undefined;
  private context: QuickJSContext | undefined;
  private isSingleNodeMode = false;
  private targetNodeId?: string;

  private onStatusChange?: (nodeId: string, status: ExecutionStatus) => void;
  private onNodeCompleted?: (result: IExecutionNodeResult) => void;
  private onNodeStarted?: (
    nodeId: string,
    inputData: INodeExecutionData[],
    executionId: string,
  ) => void;

  constructor(
    workflow: IWorkflow,
    onStatusChange?: (nodeId: string, status: ExecutionStatus) => void,
    onNodeCompleted?: (result: IExecutionNodeResult) => void,
    onNodeStarted?: (
      nodeId: string,
      inputData: INodeExecutionData[],
      executionId: string,
    ) => void,
  ) {
    this.workflow = workflow;
    this.onStatusChange = onStatusChange;
    this.onNodeCompleted = onNodeCompleted;
    this.onNodeStarted = onNodeStarted;
  }

  setInitialData(data: Map<string, INodeExecutionData[]>) {
    this.executionData = new Map(data);
  }

  async run(
    triggerNodeId?: string,
    triggerData?: INodeExecutionData[],
  ): Promise<IWorkflowExecutionResult> {
    const startTime = Date.now();
    this.nodeExecutionResults = [];
    this.isSingleNodeMode = false;

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
    } catch {
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
      this.cleanup();
    }
  }

  async runNode(nodeId: string): Promise<IWorkflowExecutionResult> {
    const startTime = Date.now();
    this.nodeExecutionResults = [];
    this.isSingleNodeMode = true;
    this.targetNodeId = nodeId;

    // Initialize QuickJS
    const quickJS = await getQuickJS();
    this.runtime = quickJS.newRuntime();
    this.context = this.runtime.newContext();
    this.setupGlobalContext();

    const targetNode = this.workflow.nodes.find((n) => n.id === nodeId);
    if (!targetNode) {
      throw new Error(`Node ${nodeId} not found`);
    }

    try {
      await this.ensureNodeExecuted(targetNode);
      return {
        id: crypto.randomUUID(),
        workflowId: this.workflow.id,
        workflowName: this.workflow.name,
        startTime,
        endTime: Date.now(),
        status: "success",
        nodeExecutionResults: this.nodeExecutionResults,
      };
    } catch (e) {
      console.error("Single node execution failed", e);
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
      this.cleanup();
    }
  }

  private cleanup() {
    this.context?.dispose();
    this.runtime?.dispose();
    this.context = undefined;
    this.runtime = undefined;
  }

  private async ensureNodeExecuted(node: IWorkflowNode) {
    // If it's not the target node and we already have data, we're good
    if (node.id !== this.targetNodeId && this.executionData.has(node.id)) {
      return this.executionData.get(node.id)!;
    }

    // Find predecessors
    const incomingEdges = this.workflow.edges.filter((e) => e.target === node.id);
    const predecessorIds = Array.from(new Set(incomingEdges.map((e) => e.source)));

    // Recursively ensure predecessors are executed
    for (const predId of predecessorIds) {
      const predNode = this.workflow.nodes.find((n) => n.id === predId);
      if (predNode) {
        await this.ensureNodeExecuted(predNode);
      }
    }

    // Prepare input data for this node from all incoming edges
    // For now, we simplify: take the first available data from a 'main' connection
    const mainInputEdge = incomingEdges.find(e => !e.targetHandle || e.targetHandle === "main");
    const inputData = mainInputEdge ? (this.executionData.get(mainInputEdge.source) || []) : [];

    // Execute the node
    return await this.executeNode(node, inputData);
  }

  private async executeNode(
    node: IWorkflowNode,
    inputData: INodeExecutionData[],
  ): Promise<INodeExecutionData[]> {
    console.log(`Executing node ${node.id} (${node.type})`);
    const executionId = crypto.randomUUID();
    this.onStatusChange?.(node.id, "running");
    this.onNodeStarted?.(node.id, inputData, executionId);
    const startTime = Date.now();

    // Find node type definition
    const nodeType = Registry.get(node.type);
    if (!nodeType) {
      throw new Error(`Node type ${node.type} not found`);
    }

    // Prepare execution context
    const itemIndex = 0;
    const executionFunctions: IExecuteFunctions = {
      getInputData: () => inputData,
      getNodeParameter: (paramName: string, ...args: unknown[]) => {
        let index = itemIndex;
        let fallback: unknown = undefined;

        if (typeof args[0] === "number") {
          index = args[0];
          fallback = args[1];
        } else {
          fallback = args[0];
        }

        const value = node.data?.[paramName] ?? fallback;
        return evaluateParameters.call(this, value, index, inputData);
      },
      getConnectedNodes: (inputName: string) => {
        const edges = this.workflow.edges.filter(
          (e) => e.target === node.id && e.targetHandle === inputName,
        );
        const sourceIds = edges.map((e) => e.source);
        return this.workflow.nodes
          .filter((n) => sourceIds.includes(n.id))
          .map((n) => {
            const nodeType = Registry.get(n.type);
            return {
              id: n.id,
              type: n.type,
              nodeType,
              data: n.data,
            };
          });
      },
      getCredential: async (credentialType: string) => {
        const credentialId =
          (node.data?.credentials as Record<string, string> | undefined)?.[
            credentialType
          ];
        if (!credentialId) return null;

        const { CredentialService } = await import(
          "../services/credential-service"
        );
        return await CredentialService.getDecryptedCredential(credentialId);
      },
      evaluateExpression: (expression: string, itemIndex: number) => {
        return this.evaluateStringWithExpressions(
          expression,
          itemIndex,
          inputData,
        );
      },
      getNodeOutputData: (nodeName: string) => {
        const targetNode = this.workflow.nodes.find(
          (n) => (n.data?.label || n.id) === nodeName,
        );
        if (!targetNode) return [];
        return this.executionData.get(targetNode.id) || [];
      },
    };

    // Execute
    let outputData: INodeExecutionData[][] = [[]];
    let executeError: Error | null = null;

    try {
      const { validateNode } = await import("../utils/validation");
      const validationResult = validateNode(node);
      if (!validationResult.isValid) {
        throw new Error(
          `Node validation failed: ${validationResult.errors.join(", ")}`,
        );
      }

      if (nodeType.execute) {
        outputData = await nodeType.execute.call(executionFunctions);
      } else {
        outputData = [[{ json: {} }]];
      }
    } catch (e) {
      console.error("Node execution error", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      toast.error("Node execution error", {
        description: errorMessage,
      });
      executeError = e instanceof Error ? e : new Error(errorMessage);
      throw e;
    } finally {
      const endTime = Date.now();
      const nodeResult: IExecutionNodeResult = {
        id: executionId,
        nodeId: node.id,
        nodeName: node.data?.label || nodeType.description.displayName,
        startTime,
        endTime,
        status: executeError ? "error" : "success",
        errorMessage: executeError?.message,
        inputData,
        outputData: outputData[0],
      };
      this.nodeExecutionResults.push(nodeResult);
      this.onStatusChange?.(node.id, executeError ? "error" : "success");
      this.onNodeCompleted?.(nodeResult);
    }

    const finalOutput = outputData[0];
    this.executionData.set(node.id, finalOutput);

    // If in single node mode, only execute if it's a prerequisite (handled by ensureNodeExecuted)
    // and don't trigger children from here.
    if (this.isSingleNodeMode) {
      return finalOutput;
    }

    // Standard flow: Trigger next nodes
    const edges = this.workflow.edges.filter((e) => e.source === node.id);
    for (const edge of edges) {
      let outputIndex = 0;
      if (edge.sourceHandle && edge.sourceHandle !== "main") {
        outputIndex = nodeType.description.outputs.findIndex(
          (o) => o.name === edge.sourceHandle,
        );
      }
      if (outputIndex === -1) outputIndex = 0;

      const branchData = outputData[outputIndex];
      if (branchData && branchData.length > 0) {
        const nextNode = this.workflow.nodes.find((n) => n.id === edge.target);
        if (nextNode) {
          await this.executeNode(nextNode, branchData);
        }
      }
    }

    return finalOutput;
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
  ): unknown {
    const rootRegex = /^\s*{{\s*([\s\S]+?)\s*}}\s*$/;
    const match = text.match(rootRegex);
    if (match) {
      return this.evaluateExpression(match[1], itemIndex, inputData);
    }

    if (!text.includes("{{")) {
      return this.evaluateExpression(text, itemIndex, inputData);
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
  ): unknown {
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
    } catch (e) {
      console.error("Expression evaluation error", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      toast.error("Expression evaluation error", {
        description: errorMessage,
      });
      return expression;
    }
  }
}
