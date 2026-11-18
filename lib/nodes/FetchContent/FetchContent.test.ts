import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FetchContent } from './FetchContent';
import { IExecuteFunctions, INodeExecutionData } from '../../types';
import { browser } from 'wxt/browser';

vi.mock('wxt/browser', () => ({
  browser: {
    scripting: {
      executeScript: vi.fn(),
    },
  },
}));

describe('FetchContent Node', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const executeNode = async (inputs: INodeExecutionData[], params: Record<string, unknown>) => {
    const context = {
      getInputData: () => inputs,
      getNodeParameter: (name: string, _index: number, fallback?: unknown) => {
        return params[name] !== undefined ? params[name] : fallback;
      }
    } as unknown as IExecuteFunctions;
    return FetchContent.execute!.call(context);
  };

  const executeScriptMock = () =>
    vi.mocked(
      browser.scripting.executeScript as unknown as (
        ...args: unknown[]
      ) => Promise<unknown>,
    );

  it('should fetch content from tab and return data', async () => {
    executeScriptMock().mockResolvedValue([{ result: 'some text' }]);
    const inputs = [{ json: {} }];
    const params = { tabId: 123, selector: '.test', selectorType: 'css', contentType: 'text', multiple: false };
    const result = await executeNode(inputs, params);
    expect(result[0][0].json.content).toBe('some text');
  });

  it('should handle HTML content type', async () => {
    executeScriptMock().mockResolvedValue([{ result: '<div>html</div>' }]);
    const result = await executeNode([{ json: {} }], { tabId: 1, selector: 'div', contentType: 'html' });
    expect(result[0][0].json.content).toBe('<div>html</div>');
  });

  it('should handle multiple elements if specified', async () => {
    executeScriptMock().mockResolvedValue([{ result: ['a', 'b'] }]);
    const result = await executeNode([{ json: {} }], { tabId: 1, selector: 'p', multiple: true });
    expect(result[0][0].json.content).toEqual(['a', 'b']);
  });

  it('should return error for invalid tabId', async () => {
    const result = await executeNode([{ json: {} }], { tabId: NaN, selector: '.x' });
    expect(result[0][0].json.error).toBe('Invalid Tab ID');
  });
});