import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Code } from './Code';
import { IExecuteFunctions } from '../../types';

const mockContext = {
  newFunction: vi.fn(() => ({ dispose: () => {} })),
  newObject: vi.fn(() => ({ dispose: () => {} })),
  setProp: vi.fn(),
  newString: vi.fn((s: string) => ({ value: s, dispose: () => {} })),
  getProp: vi.fn(() => ({ dispose: () => {} })),
  callFunction: vi.fn((fn: any) => {
    if (fn.type === 'parse') {
      return { value: { type: 'itemsObj', dispose: () => {} }, error: undefined };
    }
    // Execution call
    return { value: { type: 'result', dispose: () => {} }, error: undefined };
  }),
  evalCode: vi.fn(() => ({ value: { type: 'func', dispose: () => {} }, error: undefined })),
  dump: vi.fn((h: any) => {
    if (h.type === 'result') return [{ json: { transformed: true } }];
    return h;
  }),
  dispose: vi.fn(),
  global: {},
  undefined: {}
};

// Add internal identifiers for callFunction logic
(mockContext.getProp as any).mockImplementation((obj: any, prop: string) => {
  if (prop === 'parse') return { type: 'parse', dispose: () => {} };
  return { dispose: () => {} };
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

  const executeNode = async (inputs: any[], params: Record<string, any>) => {
    const context = {
      getInputData: () => inputs,
      getNodeParameter: (name: string, index: number, fallback?: any) => {
        return params[name] !== undefined ? params[name] : fallback;
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

  it('should throw error if script does not return an array', async () => {
    mockContext.dump.mockReturnValueOnce({}); // Not an array
    const inputs = [{ json: {} }];
    await expect(executeNode(inputs, { code: 'return {};' })).rejects.toThrow('Script must return an array of items');
  });
});