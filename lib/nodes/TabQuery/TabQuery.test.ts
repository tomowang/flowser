import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TabQuery } from './TabQuery';
import { IExecuteFunctions } from '../../types';
import { browser } from 'wxt/browser';

vi.mock('wxt/browser', () => ({
  browser: {
    tabs: {
      query: vi.fn(),
    },
  },
}));

describe('TabQuery Node', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const executeNode = async (inputs: any[], params: Record<string, any>) => {
    const context = {
      getInputData: () => inputs,
      getNodeParameter: (name: string, indexOrFallback: any, arg3?: any) => {
        let index = 0;
        let fallback: any;
        if (typeof indexOrFallback === 'number') {
          index = indexOrFallback;
          fallback = arg3;
        } else {
          fallback = indexOrFallback;
        }
        return params[name] !== undefined ? params[name] : fallback;
      }
    } as unknown as IExecuteFunctions;
    return TabQuery.execute!.call(context);
  };

  it('should query tabs with correct parameters', async () => {
    const mockTabs = [{ id: 1, title: 'Google' }];
    vi.mocked(browser.tabs.query).mockResolvedValue(mockTabs as any);
    
    const params = {
      title: '*Google*',
      url: '*google.com*',
      active: 'yes',
      tabStatus: 'complete'
    };

    const result = await executeNode([], params);

    expect(browser.tabs.query).toHaveBeenCalledWith({
      title: '*Google*',
      url: '*google.com*',
      active: true,
      status: 'complete'
    });
    expect(result[0][0].json.id).toBe(1);
  });

  it('should handle any active status', async () => {
    vi.mocked(browser.tabs.query).mockResolvedValue([] as any);
    await executeNode([], { active: 'any' });
    expect(browser.tabs.query).toHaveBeenCalledWith({});
  });
});