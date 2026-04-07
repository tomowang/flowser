import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClickElement } from '../lib/nodes/ClickElement/ClickElement';
import { IExecuteFunctions, INodeExecutionData } from '../lib/types';
import { browser } from 'wxt/browser';

vi.mock('wxt/browser', () => ({
  browser: {
    scripting: {
      executeScript: vi.fn(),
    },
  },
}));

describe('ClickElement Node', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const executeNode = async (
    inputs: INodeExecutionData[],
    params: Record<string, unknown>,
  ) => {
    const context = {
      getInputData: () => inputs,
      getNodeParameter: (name: string, indexOrFallback: unknown, arg3?: unknown) => {
        let index = 0;
        let fallback: unknown;
        if (typeof indexOrFallback === 'number') {
          index = indexOrFallback;
          fallback = arg3;
        } else {
          fallback = indexOrFallback;
        }

        const value = params[name] !== undefined ? params[name] : fallback;
        if (typeof value === 'string' && value.startsWith('=')) {
          if (value === '={{ $json.id }}') {
            return inputs[index].json.id;
          }
        }
        return value;
      },
    } as unknown as IExecuteFunctions;

    return ClickElement.execute!.call(context);
  };

  it('should fail if no selector is provided', async () => {
    await expect(
      executeNode([{ json: { id: 1 } }], { selector: '', tabId: 1 }),
    ).rejects.toThrow('Selector is required');
  });

  it('should execute script for each input item with ID', async () => {
    const inputs = [{ json: { id: 1 } }, { json: { id: 2 } }];
    await executeNode(inputs, { 
      selector: '.btn', 
      selectorType: 'css', 
      tabId: '={{ $json.id }}' 
    });

    expect(browser.scripting.executeScript).toHaveBeenCalledTimes(2);
    expect(browser.scripting.executeScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 1 },
        args: ['css', '.btn', false],
      }),
    );
    expect(browser.scripting.executeScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 2 },
        args: ['css', '.btn', false],
      }),
    );
  });

  it('should handle xpath selector type', async () => {
    const inputs = [{ json: { id: 1 } }];
    await executeNode(inputs, { 
      selector: '//button', 
      selectorType: 'xpath',
      tabId: 1
    });

    expect(browser.scripting.executeScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 1 },
        args: ['xpath', '//button', false],
      }),
    );
  });

  it('should pass multiple flag', async () => {
    const inputs = [{ json: { id: 1 } }];
    await executeNode(inputs, { 
      selector: '.btn', 
      multiple: true,
      tabId: 1
    });

    expect(browser.scripting.executeScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 1 },
        args: ['css', '.btn', true],
      }),
    );
  });

  it('should use text-specified tabId if provided', async () => {
    const inputs = [{ json: { id: 1 } }];
    await executeNode(inputs, { selector: '.btn', tabId: 999 });

    expect(browser.scripting.executeScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 999 },
        args: ['css', '.btn', false],
      }),
    );
  });
});