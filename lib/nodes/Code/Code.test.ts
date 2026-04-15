import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Code } from './Code';
import { IExecuteFunctions, INodeExecutionData } from '../../types';

const mockContext = {
  newFunction: vi.fn(() => ({ dispose: () => {} })),
  newObject: vi.fn(() => ({ dispose: () => {} })),
  setProp: vi.fn(),
  newString: vi.fn((s: string) => ({ value: s, dispose: () => {} })),
  getProp: vi.fn(() => ({ dispose: () => {} })),
  callFunction: vi.fn((fn: { type: string }) => {
    if (fn.type === 'parse') {
      return { value: { type: 'itemsObj', dispose: () => {} }, error: undefined };
    }
    // Execution call
    return { value: { type: 'result', dispose: () => {} }, error: undefined };
  }),
  evalCode: vi.fn(() => ({ value: { type: 'func', dispose: () => {} }, error: undefined })),
  dump: vi.fn((h: { type?: string }) => {
    if (h.type === 'result') return [{ json: { transformed: true } }];
    return h;
  }),
  dispose: vi.fn(),
  global: {},
  undefined: {}
};

// Add internal identifiers for callFunction logic
vi.mocked(mockContext.getProp).mockImplementation((_obj: unknown, prop: string) => {
  if (prop === 'parse') return { type: 'parse', dispose: () => { } } as unknown as { type: string; dispose: () => void };
  return { dispose: () => { } } as unknown as { type: string; dispose: () => void };
});

const mockRuntime = {
  newContext: () => mockContext,
  dispose: vi.fn()
};

vi.mock('../../services/quickjs', () => ({
  getQuickJS: async () => ({
    newRuntime: () => mockRuntime
  })
}));

describe('Code Node', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const executeNode = async (inputs: INodeExecutionData[], params: Record<string, unknown>, nodeOutputData: Record<string, INodeExecutionData[]> = {}) => {
    const context = {
      getInputData: () => inputs,
      getNodeParameter: (name: string, _index: number, fallback?: unknown) => {
        return params[name] !== undefined ? params[name] : fallback;
      },
      getNodeOutputData: (name: string) => {
        return nodeOutputData[name] || [];
      }
    } as unknown as IExecuteFunctions;
    return Code.execute!.call(context);
  };

  it('should execute code and return transformed items', async () => {
    const inputs = [{ json: { val: 1 } }];
    const result = await executeNode(inputs, { code: 'return items.map(i => ({ json: { transformed: true } }));' });

    expect(result[0]).toHaveLength(1);
    expect(result[0][0].json.transformed).toBe(true);
    expect(mockContext.evalCode).toHaveBeenCalled();
  });

  it('should support $(...) syntax to access other node data', async () => {
    const inputs = [{ json: { val: 1 } }];
    const otherNodeData = [{ json: { external: 'data' } }];
    
    // In real execution, context.dump would be called on the result of $('Other').all()
    // Our mock dump returns what we tell it.
    mockContext.dump.mockImplementation((h: { type?: string }) => {
      if (h.type === 'result') return [{ json: { accessed: 'data' } }];
      return h;
    });

    const code = "const other = $('Other').all(); return [{ json: { accessed: other[0].json.external } }];";
    // This is hard to test purely with mocks because we aren't running real QuickJS here.
    // But we can check if $ was set.
    
    await executeNode(inputs, { code }, { 'Other': otherNodeData });
    expect(mockContext.newFunction).toHaveBeenCalledWith('$', expect.any(Function));
  });

  it('should throw error if script does not return an array', async () => {
    mockContext.dump.mockReturnValueOnce({}); // Not an array
    const inputs = [{ json: {} }];
    await expect(executeNode(inputs, { code: 'return {};' })).rejects.toThrow('Script must return an array of items');
  });
});