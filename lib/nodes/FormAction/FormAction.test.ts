import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormAction } from './FormAction';
import { IExecuteFunctions, INodeExecutionData } from '../../types';
import { browser } from 'wxt/browser';

vi.mock('wxt/browser', () => ({
  browser: {
    scripting: {
      executeScript: vi.fn(),
    },
  },
}));

describe('FormAction Node', () => {
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
    return FormAction.execute!.call(context);
  };

  it('should fill a text field', async () => {
    vi.mocked(browser.scripting.executeScript).mockResolvedValue([{ result: { ok: true } }] as unknown as { result: unknown }[]);

    const result = await executeNode([{ json: {} }], {
      tabId: 1,
      fields: {
        values: [
          { selectorType: 'css', selector: '#email', fieldType: 'text', value: 'a@b.com' },
        ],
      },
    });

    expect(browser.scripting.executeScript).toHaveBeenCalledTimes(1);
    const call = vi.mocked(browser.scripting.executeScript).mock.calls[0][0];
    expect(call.target).toEqual({ tabId: 1 });
    expect(call.args).toEqual(['css', '#email', 'text', 'a@b.com', true]);
    expect(result[0][0].json.results).toEqual([
      { selector: '#email', fieldType: 'text', ok: true },
    ]);
  });

  it('should pass comma-separated values for a multi-select field', async () => {
    vi.mocked(browser.scripting.executeScript).mockResolvedValue([{ result: { ok: true } }] as unknown as { result: unknown }[]);

    await executeNode([{ json: {} }], {
      tabId: 1,
      fields: {
        values: [
          { selectorType: 'css', selector: '#colors', fieldType: 'select', value: 'red, blue' },
        ],
      },
    });

    const call = vi.mocked(browser.scripting.executeScript).mock.calls[0][0];
    expect(call.args).toEqual(['css', '#colors', 'select', 'red, blue', true]);
  });

  it('should default checked to true for checkbox fields when unspecified', async () => {
    vi.mocked(browser.scripting.executeScript).mockResolvedValue([{ result: { ok: true } }] as unknown as { result: unknown }[]);

    await executeNode([{ json: {} }], {
      tabId: 1,
      fields: {
        values: [{ selectorType: 'css', selector: '#agree', fieldType: 'checkbox' }],
      },
    });

    const call = vi.mocked(browser.scripting.executeScript).mock.calls[0][0];
    expect(call.args).toEqual(['css', '#agree', 'checkbox', '', true]);
  });

  it('should select a radio option by value', async () => {
    vi.mocked(browser.scripting.executeScript).mockResolvedValue([{ result: { ok: true } }] as unknown as { result: unknown }[]);

    await executeNode([{ json: {} }], {
      tabId: 1,
      fields: {
        values: [
          { selectorType: 'css', selector: "input[name='plan']", fieldType: 'radio', value: 'pro' },
        ],
      },
    });

    const call = vi.mocked(browser.scripting.executeScript).mock.calls[0][0];
    expect(call.args).toEqual(['css', "input[name='plan']", 'radio', 'pro', true]);
  });

  it('should report a field-level error without throwing', async () => {
    vi.mocked(browser.scripting.executeScript).mockResolvedValue([
      { result: { ok: false, error: 'Element not found' } },
    ] as unknown as { result: unknown }[]);

    const result = await executeNode([{ json: {} }], {
      tabId: 1,
      fields: {
        values: [{ selectorType: 'css', selector: '#missing', fieldType: 'text', value: 'x' }],
      },
    });

    expect(result[0][0].json.results).toEqual([
      { selector: '#missing', fieldType: 'text', ok: false, error: 'Element not found' },
    ]);
  });

  it('should skip a row missing a selector', async () => {
    const result = await executeNode([{ json: {} }], {
      tabId: 1,
      fields: {
        values: [{ selectorType: 'css', selector: '', fieldType: 'text', value: 'x' }],
      },
    });

    expect(browser.scripting.executeScript).not.toHaveBeenCalled();
    expect(result[0][0].json.results).toEqual([
      { selector: '', fieldType: 'text', ok: false, error: 'Selector is required' },
    ]);
  });

  it('should return an error for an invalid tabId', async () => {
    const result = await executeNode([{ json: {} }], { tabId: NaN, fields: {} });

    expect(browser.scripting.executeScript).not.toHaveBeenCalled();
    expect(result[0][0].json.error).toBe('Invalid Tab ID');
  });
});
