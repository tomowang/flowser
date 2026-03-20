import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FetchContent } from './FetchContent';
import { IExecuteFunctions } from '../../types';
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

  const executeNode = async (inputs: any[], params: Record<string, any>) => {
    const context = {
      getInputData: () => inputs,
      getNodeParameter: (name: string, index: number, fallback?: any) => {
        return params[name] !== undefined ? params[name] : fallback;
      }
    } as unknown as IExecuteFunctions;
    return FetchContent.execute!.call(context);
  };

  it('should fetch content from tab and return data', async () => {
    vi.mocked(browser.scripting.executeScript).mockResolvedValue([{ result: 'some text' }] as any);
    const inputs = [{ json: {} }];
    const params = { tabId: 123, selector: '.test', selectorType: 'css', contentType: 'text', multiple: false };
    const result = await executeNode(inputs, params);
    expect(result[0][0].json.content).toBe('some text');
  });

  it('should handle HTML content type', async () => {
    vi.mocked(browser.scripting.executeScript).mockResolvedValue([{ result: '<div>html</div>' }] as any);
    const result = await executeNode([{ json: {} }], { tabId: 1, selector: 'div', contentType: 'html' });
    expect(result[0][0].json.content).toBe('<div>html</div>');
  });

  it('should handle multiple elements if specified', async () => {
    vi.mocked(browser.scripting.executeScript).mockResolvedValue([{ result: ['a', 'b'] }] as any);
    const result = await executeNode([{ json: {} }], { tabId: 1, selector: 'p', multiple: true });
    expect(result[0][0].json.content).toEqual(['a', 'b']);
  });

  it('should return error for invalid tabId', async () => {
    const result = await executeNode([{ json: {} }], { tabId: NaN, selector: '.x' });
    expect(result[0][0].json.error).toBe('Invalid Tab ID');
  });
});