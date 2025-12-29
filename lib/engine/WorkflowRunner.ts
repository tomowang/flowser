import {
  IWorkflow,
  INodeExecutionData,
  IExecuteFunctions,
  IWorkflowNode,
  IWorkflowExecutionResult,
  IExecutionNodeResult,
} from "../types";
import { Registry } from "../nodes/registry";

export class WorkflowRunner {
  private workflow: IWorkflow;
  private executionData: Map<string, INodeExecutionData[]> = new Map();
  private nodeExecutionResults: IExecutionNodeResult[] = [];

  constructor(workflow: IWorkflow) {
    this.workflow = workflow;
  }

  async run(triggerNodeId?: string): Promise<IWorkflowExecutionResult> {
    const startTime = Date.now();
    this.nodeExecutionResults = [];

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
      await this.executeNode(startNode, []);
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
    const executionFunctions: IExecuteFunctions = {
      getInputData: () => inputData,
      getNodeParameter: (paramName: string, fallback?: any) => {
        // Retrieve from node.data or node.parameters
        // Vue Flow stores custom data in .data
        return node.data?.[paramName] ?? fallback;
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
          .map((n) => ({
            id: n.id,
            type: n.type,
            // We could attach the nodeType definition here if needed
            data: n.data, // access params
          }));
      },
    };

    // Execute
    let outputData: INodeExecutionData[][] = [[]];
    let executeError: any = null;

    try {
      if (nodeType.execute) {
        // Need to extend IExecuteFunctions interface in types.ts to make TS happy
        // casting for now or update types.ts
        outputData = await nodeType.execute.call(executionFunctions as any);
      } else {
        outputData = [[{ json: {} }]];
      }
    } catch (e) {
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
}
