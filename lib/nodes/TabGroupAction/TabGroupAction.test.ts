import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TabGroupAction } from './TabGroupAction';
import { IExecuteFunctions, INodeExecutionData } from '../../types';
import { browser } from 'wxt/browser';

vi.mock('wxt/browser', () => ({
  browser: {
    tabs: {
      group: vi.fn(),
    },
    tabGroups: {
      update: vi.fn(),
    },
  },
}));

describe('TabGroupAction Node', () => {
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
    return TabGroupAction.execute!.call(context);
  };

  it('should create a tab group', async () => {
    vi.mocked(browser.tabs.group).mockResolvedValue(10 as unknown as number);
    vi.mocked(browser.tabGroups.update).mockResolvedValue({
      id: 10,
      title: 'Work',
      color: 'blue',
      collapsed: false,
      windowId: 1,
    } as unknown as Awaited<ReturnType<typeof browser.tabGroups.update>>);

    const result = await executeNode([{ json: {} }], {
      action: 'create',
      tabIds: '1, 2',
      windowId: 1,
      title: 'Work',
      color: 'blue',
      collapsed: false,
    });

    expect(browser.tabs.group).toHaveBeenCalledWith({
      tabIds: [1, 2],
      createProperties: { windowId: 1 },
    });
    expect(browser.tabGroups.update).toHaveBeenCalledWith(10, {
      collapsed: false,
      title: 'Work',
      color: 'blue',
    });
    expect(result[0][0].json.id).toBe(10);
    expect(result[0][0].json.title).toBe('Work');
  });

  it('should error when no valid tab IDs are provided', async () => {
    const result = await executeNode([{ json: {} }], { action: 'create', tabIds: '' });

    expect(browser.tabs.group).not.toHaveBeenCalled();
    expect(result[0][0].json.error).toBe('No valid Tab IDs provided');
  });
});
