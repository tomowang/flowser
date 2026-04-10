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
        // Handle optional itemIndex argument
        // getNodeParameter(name, index, fallback)
        // getNodeParameter(name, fallback)
        let index = itemIndex;
        let fallback: unknown = undefined;

        if (typeof args[0] === "number") {
          index = args[0];
          fallback = args[1];
        } else {
          fallback = args[0];
        }

        // Retrieve from node.data or node.parameters
        // Vue Flow stores custom data in .data
        const value = node.data?.[paramName] ?? fallback;

        return evaluateParameters.call(this, value, index, inputData);
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
      getCredential: async (credentialType: string) => {
        // Credentials are stored in node.data.credentials[credentialType] as credential ID
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
    };

    // Execute
    let outputData: INodeExecutionData[][] = [[]];
    let executeError: Error | null = null;

    try {
      // Validate node
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


    // Store execution data
    this.executionData.set(node.id, outputData[0]);

    // Find next nodes
    // Iterate over all connected edges from this node
    const edges = this.workflow.edges.filter((e) => e.source === node.id);

    for (const edge of edges) {
      // Determine which output index this edge is connected to
      let outputIndex = 0;
      if (edge.sourceHandle && edge.sourceHandle !== "main") {
        outputIndex = nodeType.description.outputs.findIndex(
          (o) => o.name === edge.sourceHandle,
        );
      }

      if (outputIndex === -1) {
        // Fallback to index 0 if valid handle not found
        // or effectively skip if strict?
        // Let's assume index 0 if not found, but log warning
        console.warn(
          `Could not find output handle ${edge.sourceHandle} for node ${node.type}`,
        );
        outputIndex = 0;
      }

      const branchData = outputData[outputIndex];

      // But undefined means the branch is not taken (e.g. If node returns [items, []] - empty branch takes empty array?)
      // Wait, If Node returns: [returnDataTrue, returnDataFalse]
      // If true branch has items, false branch might have 0 items.
      // If we execute next node with 0 items, it runs 0 times.
      // That is correct behavior for data processing nodes.
      // However, check if branchData exists (index in bounds).
      if (branchData && branchData.length > 0) {
        const nextNode = this.workflow.nodes.find((n) => n.id === edge.target);
        if (nextNode) {
          await this.executeNode(nextNode, branchData);
        }
      }
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
