import { INodeType } from "../types";

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
