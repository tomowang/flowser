import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TabAction } from './TabAction';
import { IExecuteFunctions } from '../../types';
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

  const executeNode = async (inputs: any[], params: Record<string, any>) => {
    const context = {
      getInputData: () => inputs,
      getNodeParameter: (name: string, index: number, fallback?: any) => {
        return params[name] !== undefined ? params[name] : fallback;
      }
    } as unknown as IExecuteFunctions;
    return TabAction.execute!.call(context);
  };

  it('should create a tab', async () => {
    vi.mocked(browser.tabs.create).mockResolvedValue({ id: 1, url: 'http://test.com' } as any);
    const result = await executeNode([{ json: {} }], { action: 'create', url: 'http://test.com', active: true });
    
    expect(browser.tabs.create).toHaveBeenCalledWith({ url: 'http://test.com', active: true, pinned: undefined });
    expect(result[0][0].json.id).toBe(1);
  });

  it('should close a tab', async () => {
    vi.mocked(browser.tabs.remove).mockResolvedValue(undefined as any);
    const result = await executeNode([{ json: {} }], { action: 'close', tabId: 123 });
    
    expect(browser.tabs.remove).toHaveBeenCalledWith(123);
    expect(result[0][0].json.closed).toBe(true);
  });

  it('should group tabs', async () => {
    vi.mocked(browser.tabs.group).mockResolvedValue(10 as any);
    const result = await executeNode([{ json: {} }], { action: 'group', tabIds: '1, 2', groupId: 5 });
    
    expect(browser.tabs.group).toHaveBeenCalledWith({ tabIds: [1, 2], groupId: 5 });
    expect(result[0][0].json.groupId).toBe(10);
  });
});