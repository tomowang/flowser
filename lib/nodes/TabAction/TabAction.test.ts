import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TabAction } from './TabAction';
import { IExecuteFunctions, INodeExecutionData } from '../../types';
import { browser } from 'wxt/browser';

vi.mock('wxt/browser', () => ({
  browser: {
    tabs: {
      create: vi.fn(),
      remove: vi.fn(),
      group: vi.fn(),
    },
  },
}));

describe('TabAction Node', () => {
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
    return TabAction.execute!.call(context);
  };

  it('should create a tab', async () => {
    vi.mocked(browser.tabs.create as unknown as (...args: unknown[]) => Promise<unknown>).mockResolvedValue({ id: 1, url: 'http://test.com' });
    const result = await executeNode([{ json: {} }], { action: 'create', url: 'http://test.com', active: true });
    
    expect(browser.tabs.create).toHaveBeenCalledWith({ url: 'http://test.com', active: true, pinned: undefined });
    expect(result[0][0].json.id).toBe(1);
  });

  it('should close a tab', async () => {
    vi.mocked(browser.tabs.remove as unknown as (...args: unknown[]) => Promise<void>).mockResolvedValue(undefined);
    const result = await executeNode([{ json: {} }], { action: 'close', tabId: 123 });
    
    expect(browser.tabs.remove).toHaveBeenCalledWith(123);
    expect(result[0][0].json.closed).toBe(true);
  });

  it('should group tabs', async () => {
    vi.mocked(browser.tabs.group as unknown as (...args: unknown[]) => Promise<number>).mockResolvedValue(10);
    const result = await executeNode([{ json: {} }], { action: 'group', tabIds: '1, 2', groupId: 5 });
    
    expect(browser.tabs.group).toHaveBeenCalledWith({ tabIds: [1, 2], groupId: 5 });
    expect(result[0][0].json.groupId).toBe(10);
  });
});