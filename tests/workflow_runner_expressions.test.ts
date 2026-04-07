import { describe, it, expect, vi } from 'vitest';
import { WorkflowRunner } from '../lib/engine/WorkflowRunner';
import { IWorkflow, INodeType } from '../lib/types';
import { Registry } from '../lib/nodes/registry';
const ParamNode: INodeType = {
  description: { displayName: 'Param Node', name: 'paramNode', icon: '', group: ['test'], version: 1, description: 'Returns its params', defaults: { name: 'Param Node' }, inputs: [{ name: 'main', type: 'main' }], outputs: [{ name: 'main', type: 'main' }], properties: [{ displayName: 'Value', name: 'value', type: 'string' }] },
  async execute() { const value = this.getNodeParameter('value', ''); return [[{ json: { value } }]]; }
};
const ManualTriggerNode: INodeType = {
  description: { displayName: 'Manual Trigger', name: 'manualTrigger', icon: '', group: ['trigger'], version: 1, description: 'Manual Trigger', defaults: { name: 'Manual Trigger' }, inputs: [], outputs: [{ name: 'main', type: 'main' }], properties: [] },
  async execute() { return [[{ json: { name: 'World' } }]]; }
};
Registry.register(ParamNode);
Registry.register(ManualTriggerNode);
interface MockHandle {
  _isHandle: boolean;
  value?: unknown;
  code?: string;
  dispose: () => void;
}

const mockContext = {
  newFunction: vi.fn(() => ({ dispose: () => { } })),
  getString: vi.fn((h) => h),
  newObject: vi.fn(() => ({ dispose: () => { } })),
  getProp: vi.fn(() => ({ dispose: () => { } })),
  setProp: vi.fn(),
  callFunction: vi.fn(() => ({ dispose: () => { }, value: { dispose: () => { } }, error: undefined })),
  newString: vi.fn((s) => ({ _isHandle: true, value: s, dispose: () => { } })),
  getNumber: vi.fn((h) => h.value),
  newNumber: vi.fn((n) => ({ _isHandle: true, value: n, dispose: () => { } })),
  evalCode: vi.fn((code) => ({ value: { _isHandle: true, code, dispose: () => { } }, error: undefined, dispose: () => { } })),
  dump: vi.fn((handle: unknown) => {
    if (handle && (handle as MockHandle)._isHandle) {
      const mockHandle = handle as MockHandle;
      const c = mockHandle.code?.trim();
      console.log("DUMP CODE: [" + c + "]");
      if (c === '$json.name' || c === '\$json.name') return 'World';
      if (c === '1 + 1') return 2;
      return mockHandle.value !== undefined ? mockHandle.value : mockHandle.code;
    }
    return handle;
  }),
  dispose: vi.fn(), global: {}, undefined: undefined
};
const mockRuntime = { newContext: () => mockContext, dispose: () => { } };
vi.mock('../lib/services/quickjs', () => ({ getQuickJS: async () => ({ newRuntime: () => mockRuntime }) }));
vi.mock('vue-sonner', () => ({ toast: { error: vi.fn(), warning: vi.fn() } }));
describe('WorkflowRunner Expressions Integration', () => {
  it('should evaluate expression in node parameter', async () => {
    const workflow: IWorkflow = {
      id: 'wf-1', name: 'Expression Test', nodes: [{ id: 'trigger', type: 'manualTrigger', position: { x: 0, y: 0 }, data: { label: 'Start' } }, { id: 'node-1', type: 'paramNode', position: { x: 100, y: 0 }, data: { label: 'Node 1', value: '={{ $json.name }}' } }],
      edges: [{ id: 'e1', source: 'trigger', target: 'node-1', sourceHandle: 'main', targetHandle: 'main' }],
      createdAt: Date.now(), updatedAt: Date.now(), active: true, previewSvg: ''
    };
    const runner = new WorkflowRunner(workflow);
    const result = await runner.run('trigger');
    expect(result.status).toBe('success');
    const node1Result = result.nodeExecutionResults.find(n => n.nodeId === 'node-1');
    expect(node1Result?.outputData[0].json.value).toBe('World');
  });
  it('should evaluate complex expression in node parameter', async () => {
    const workflow: IWorkflow = {
      id: 'wf-2', name: 'Complex Expression Test', nodes: [{ id: 'trigger', type: 'manualTrigger', position: { x: 0, y: 0 }, data: { label: 'Start' } }, { id: 'node-1', type: 'paramNode', position: { x: 100, y: 0 }, data: { label: 'Node 1', value: '=Hello {{ $json.name }}! 1+1={{ 1 + 1 }}' } }],
      edges: [{ id: 'e1', source: 'trigger', target: 'node-1', sourceHandle: 'main', targetHandle: 'main' }],
      createdAt: Date.now(), updatedAt: Date.now(), active: true, previewSvg: ''
    };
    const runner = new WorkflowRunner(workflow);
    const result = await runner.run('trigger');
    expect(result.status).toBe('success');
    const node1Result = result.nodeExecutionResults.find(n => n.nodeId === 'node-1');
    expect(node1Result?.outputData[0].json.value).toBe('Hello World! 1+1=2');
  });
});