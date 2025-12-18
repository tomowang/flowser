import { INodeType } from "../types";
import { ManualTrigger, HttpRequest, AgentNode, CalculatorTool } from "./index";

class NodeRegistry {
  private nodeTypes: Map<string, INodeType> = new Map();

  register(nodeType: INodeType) {
    this.nodeTypes.set(nodeType.description.name, nodeType);
  }

  get(name: string): INodeType | undefined {
    return this.nodeTypes.get(name);
  }

  getAll(): INodeType[] {
    return Array.from(this.nodeTypes.values());
  }
}

export const Registry = new NodeRegistry();

// Register standard nodes (somewhere appropriate, maybe here for now)
Registry.register(ManualTrigger);
Registry.register(HttpRequest);
Registry.register(AgentNode);
Registry.register(CalculatorTool);
