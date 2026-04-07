import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from './HttpRequest';
import { IExecuteFunctions, INodeExecutionData } from '../../types';
import { browser } from 'wxt/browser';

vi.mock('wxt/browser', () => ({
  browser: {
    runtime: {
      sendMessage: vi.fn(),
    },
  },
}));

describe('HttpRequest Node', () => {
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
    return HttpRequest.execute!.call(context);
  };

  it('should send correct parameters to browser.runtime.sendMessage', async () => {
    vi.mocked(browser.runtime.sendMessage).mockResolvedValue({ success: true, data: { result: 'ok' } } as unknown as { success: boolean; data: unknown });
    
    const inputs = [{ json: {} }];
    const params = {
      url: 'https://api.test.com',
      method: 'POST',
      parameters: JSON.stringify({ q: 'search' }),
      headers: JSON.stringify({ 'X-Test': 'val' }),
      specifyBody: 'json',
      body: JSON.stringify({ key: 'val' })
    };

    const result = await executeNode(inputs, params);

    expect(browser.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({
        url: 'https://api.test.com/?q=search',
        method: 'POST',
        headers: expect.objectContaining({ 'X-Test': 'val', 'Content-Type': 'application/json' }),
        body: { key: 'val' }
      })
    }));
    expect(result[0][0].json).toEqual({ result: 'ok' });
  });

  it('should handle error response from sendMessage', async () => {
    vi.mocked(browser.runtime.sendMessage).mockResolvedValue({ success: false, error: 'Network Error' } as unknown as { success: boolean; error: string });
    const inputs = [{ json: {} }];
    const result = await executeNode(inputs, { url: 'http://fail.com', method: 'GET' });

    expect(result[0][0].json).toEqual({ error: 'Network Error' });
  });
});