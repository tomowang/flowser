import { ref } from "vue";
import { useManualRefHistory, useDebounceFn } from "@vueuse/core";
import { type Node, type Edge } from "@vue-flow/core";

export interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Composable for managing undo/redo history in the workflow editor.
 * Uses VueUse's useManualRefHistory for explicit control over when to commit snapshots.
 */
export function useWorkflowHistory() {
  // The combined state that holds both nodes and edges
  const state = ref<WorkflowState>({
    nodes: [],
    edges: [],
  });

  // Use manual history so we control exactly when to commit
  const { history, commit, undo, redo, canUndo, canRedo, clear } =
    useManualRefHistory(state, {
      capacity: 50, // Keep last 50 states
      clone: true, // Clone state on commit to avoid reference issues
      dump: (v) => JSON.parse(JSON.stringify(v)), // Deep clone to be safe
      parse: (v) => v as WorkflowState,
    });

  // Flag to prevent recording history during undo/redo operations
  const isUndoRedoing = ref(false);

  const debouncedCommit = useDebounceFn(() => {
    if (!isUndoRedoing.value) {
      commit();
    }
  }, 500);

  // Debounced commit for batched updates (e.g. node delete + edge delete)
  const batchedCommit = useDebounceFn(() => {
    if (!isUndoRedoing.value) {
      commit();
    }
  }, 50);

  /**
   * Initialize state with workflow data. Clears history and creates first snapshot.
   */
  function initState(nodes: Node[], edges: Edge[]) {
    // We shouldn't record this as an undo-able step, but we need an initial state
    state.value = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    commit(); // Create initial snapshot (reset last.value)
    clear(); // clear history (undoStack & redoStack)
  }

  /**
   * Update state immediately (for non-position changes like add/remove).
   * Creates a new history entry.
   */
  function updateState(nodes: Node[], edges: Edge[]) {
    if (isUndoRedoing.value) return;

    state.value = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    batchedCommit();
  }

  /**
   * Update state with debounce (for position changes during drag).
   * Only commits after 300ms of inactivity.
   */
  function updateStateDebounced(nodes: Node[], edges: Edge[]) {
    if (isUndoRedoing.value) return;

    state.value = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    debouncedCommit();
  }

  /**
   * Execute undo and return the previous state.
   */
  function doUndo(): WorkflowState | null {
    if (!canUndo.value) return null;

    isUndoRedoing.value = true;
    undo();
    isUndoRedoing.value = false;

    return state.value;
  }

  /**
   * Execute redo and return the next state.
   */
  function doRedo(): WorkflowState | null {
    if (!canRedo.value) return null;

    isUndoRedoing.value = true;
    redo();
    isUndoRedoing.value = false;

    return state.value;
  }

  return {
    state,
    history,
    canUndo,
    canRedo,
    initState,
    updateState,
    updateStateDebounced,
    undo: doUndo,
    redo: doRedo,
    clear,
    commit,
  };
}
