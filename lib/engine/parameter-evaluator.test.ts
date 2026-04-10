import { describe, it, expect, vi } from 'vitest';
import { evaluateParameters } from './parameter-evaluator';

describe('evaluateParameters', () => {
  const mockEvaluator = {
    evaluateStringWithExpressions: vi.fn()
  };

  it('should evaluate a top-level string expression', () => {
    mockEvaluator.evaluateStringWithExpressions.mockReturnValue('world');
    const value = '=hello';
    const result = evaluateParameters.call(mockEvaluator, value, 0, []);
    expect(result).toBe('world');
    expect(mockEvaluator.evaluateStringWithExpressions).toHaveBeenCalledWith('hello', 0, []);
  });

  it('should not evaluate a string without = prefix', () => {
    mockEvaluator.evaluateStringWithExpressions.mockReset();
    const value = 'hello';
    const result = evaluateParameters.call(mockEvaluator, value, 0, []);
    expect(result).toBe('hello');
    expect(mockEvaluator.evaluateStringWithExpressions).not.toHaveBeenCalled();
  });

  it('should recursively evaluate expressions in objects', () => {
    mockEvaluator.evaluateStringWithExpressions.mockImplementation((text: string) => {
      if (text === '{{$json.foo}}') return 'bar';
      return text;
    });
    const value = {
      fields: {
        values: [
          { name: 'foo', value: '={{$json.foo}}' }
        ]
      }
    };
    const result = evaluateParameters.call(mockEvaluator, value, 0, []) as {
      fields: { values: { name: string; value: string }[] };
    };
    expect(result.fields.values[0].value).toBe('bar');
  });

  it('should recursively evaluate expressions in arrays', () => {
    mockEvaluator.evaluateStringWithExpressions.mockImplementation((text: string) => {
      if (text === '1') return 100;
      return text;
    });
    const value = ['=1', 'plain', '=2'];
    const result = evaluateParameters.call(mockEvaluator, value, 0, []);
    expect(result).toEqual([100, 'plain', '2']);
  });

  it('should evaluate If node conditions correctly', () => {
    mockEvaluator.evaluateStringWithExpressions.mockImplementation((text: string) => {
      if (text === '$json.v') return 1;
      return text;
    });
    const value = {
      items: [
        { value: "=$json.v", operator: "==", targetValue: "1" }
      ]
    };
    const result = evaluateParameters.call(mockEvaluator, value, 0, []) as {
      items: { value: number; operator: string; targetValue: string }[];
    };
    expect(result.items[0].value).toBe(1);
    expect(result.items[0].targetValue).toBe("1");
  });
});
