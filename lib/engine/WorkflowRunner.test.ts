import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowRunner } from './WorkflowRunner';
import { Registry } from '../nodes/registry';

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
    Registry.register(errorNode as any);

    const workflow = {
      id: 'wf-err',
      name: 'Error WF',
      nodes: [{ id: 'n1', type: 'errorNode', data: {}, position: {x:0,y:0} }],
      edges: [],
      active: true,
      previewSvg: ''
    };

    const runner = new WorkflowRunner(workflow as any);
    const result = await runner.run('n1');
    expect(result.status).toBe('error');
  });
});