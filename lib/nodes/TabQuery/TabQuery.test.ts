import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TabQuery } from './TabQuery';
import { IExecuteFunctions } from '../../types';
import { browser, type Browser } from 'wxt/browser';

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

  const executeNode = async (inputs: unknown[], params: Record<string, unknown>) => {
    const context = {
      getInputData: () => inputs,
      getNodeParameter: (name: string, indexOrFallback: unknown, arg3?: unknown) => {
        let fallback: unknown;
        if (typeof indexOrFallback === 'number') {
          fallback = arg3;
        } else {
          fallback = indexOrFallback;
        }
        return params[name] !== undefined ? params[name] : fallback;
      }
    } as unknown as IExecuteFunctions;
    return TabQuery.execute!.call(context);
  };

  const queryTabsMock = () =>
    vi.mocked(
      browser.tabs.query as unknown as (
        ...args: unknown[]
      ) => Promise<Browser.tabs.Tab[]>,
    );

  it('should query tabs with correct parameters', async () => {
    const mockTabs = [{ id: 1, title: 'Google' }];
    queryTabsMock().mockResolvedValue(mockTabs as unknown as Browser.tabs.Tab[]);
    
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
    queryTabsMock().mockResolvedValue([]);
    await executeNode([], { active: 'any' });
    expect(browser.tabs.query).toHaveBeenCalledWith({});
  });
});