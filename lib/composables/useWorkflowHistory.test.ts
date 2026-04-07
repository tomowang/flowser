import { describe, it, expect, vi } from 'vitest';
import { useWorkflowHistory } from './useWorkflowHistory';
import type { IWorkflowNode } from '../types';

// Mock vue and vueuse
vi.mock('vue', () => ({
  ref: (v: unknown) => ({ value: v })
}));

vi.mock('@vueuse/core', () => ({
  useManualRefHistory: () => ({
    history: [],
    commit: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: { value: true },
    canRedo: { value: true },
    clear: vi.fn()
  }),
  useDebounceFn: (fn: (...args: unknown[]) => unknown) => fn
}));

describe('useWorkflowHistory', () => {
  it('should initialize state', () => {
    const { initState, state } = useWorkflowHistory();
    initState([{ id: '1' } as unknown as IWorkflowNode], []);
    expect(state.value.nodes).toHaveLength(1);
  });
});