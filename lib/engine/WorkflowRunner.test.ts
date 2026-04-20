import { describe, it, expect, vi } from 'vitest';
import { WorkflowRunner } from './WorkflowRunner';
import { Registry } from '../nodes/registry';
import type { INodeType, IWorkflow } from '../types';

vi.mock('../services/quickjs', () => ({
  getQuickJS: async () => ({
    newRuntime: () => ({
      newContext: () => ({
        newFunction: () => ({ dispose: () => {} }),
        setProp: () => {},
        dispose: () => {},
        global: {},
        undefined: {}
      }),
      dispose: () => {}
    })
  })
}));

describe('WorkflowRunner', () => {
  it('should return error status if node execution fails', async () => {
    const errorNode = {
      description: { name: 'errorNode', inputs: [], outputs: [{name: 'main', type: 'main'}], properties: [] },
      execute: async () => { throw new Error('Execution Failed'); }
    };
    Registry.register(errorNode as unknown as INodeType);

    const workflow = {
      id: 'wf-err',
      name: 'Error WF',
      nodes: [{ id: 'n1', type: 'errorNode', data: {}, position: {x:0,y:0} }],
      edges: [],
      active: true,
      previewSvg: ''
    };

    const runner = new WorkflowRunner(workflow as unknown as IWorkflow);
    const result = await runner.run('n1');
    expect(result.status).toBe('error');
  });

  it('should execute predecessors if they have no output during runNode', async () => {
    const mockNode = {
      description: { name: 'mockNode', inputs: [{name: 'main', type: 'main'}], outputs: [{name: 'main', type: 'main'}], properties: [], displayName: 'Mock' },
      execute: async () => [[{ json: { success: true } }]]
    };
    Registry.register(mockNode as unknown as INodeType);

    const workflow = {
      id: 'wf-single',
      name: 'Single Node WF',
      nodes: [
        { id: 'n1', type: 'mockNode', data: { label: 'Node 1' }, position: {x:0,y:0} },
        { id: 'n2', type: 'mockNode', data: { label: 'Node 2' }, position: {x:200,y:0} }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'main', targetHandle: 'main' }
      ],
      active: true,
      previewSvg: ''
    };

    const runner = new WorkflowRunner(workflow as unknown as IWorkflow);
    const result = await runner.runNode('n2');

    expect(result.status).toBe('success');
    expect(result.nodeExecutionResults).toHaveLength(2);
    expect(result.nodeExecutionResults[0].nodeId).toBe('n1');
    expect(result.nodeExecutionResults[1].nodeId).toBe('n2');
  });

  it('should skip predecessors if they already have output during runNode', async () => {
    const mockNode = {
      description: { name: 'mockNode', inputs: [{name: 'main', type: 'main'}], outputs: [{name: 'main', type: 'main'}], properties: [], displayName: 'Mock' },
      execute: async () => [[{ json: { success: true } }]]
    };
    Registry.register(mockNode as unknown as INodeType);

    const workflow = {
      id: 'wf-single-skip',
      name: 'Single Node Skip WF',
      nodes: [
        { id: 'n1', type: 'mockNode', data: { label: 'Node 1' }, position: {x:0,y:0} },
        { id: 'n2', type: 'mockNode', data: { label: 'Node 2' }, position: {x:200,y:0} }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'main', targetHandle: 'main' }
      ],
      active: true,
      previewSvg: ''
    };

    const runner = new WorkflowRunner(workflow as unknown as IWorkflow);
    
    // Set initial data for n1
    const initialData = new Map();
    initialData.set('n1', [{ json: { fromCache: true } }]);
    runner.setInitialData(initialData);

    const result = await runner.runNode('n2');

    expect(result.status).toBe('success');
    // Should only contain n2 because n1 was skipped (it didn't need to be executed)
    expect(result.nodeExecutionResults).toHaveLength(1);
    expect(result.nodeExecutionResults[0].nodeId).toBe('n2');
  });
});