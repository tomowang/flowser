# Execution Engine

The Flowser execution engine is the core component responsible for orchestrating and running workflows. It manages node execution, data flow between nodes, expression evaluation, and persistence of execution results.

## Introduction

Flowser uses a graph-based execution model where workflows are composed of nodes connected by edges. Execution typically starts from a trigger node (e.g., Manual Trigger or Schedule Trigger) and proceeds through the graph, passing data from source nodes to target nodes.

Data is passed between nodes as an array of items, where each item follows the `INodeExecutionData` structure.

## WorkflowRunner

The `WorkflowRunner` class (`lib/engine/WorkflowRunner.ts`) is the central orchestrator of the execution process. It manages the state of a single workflow execution, including the data produced by each node and the lifecycle of the JavaScript sandbox.

### Execution Modes

The runner supports two primary execution modes:

1.  **Full Run (`run`)**: Executes the entire workflow starting from a specific trigger node (or the first "manualTrigger" node found). It follows the edges in the graph to determine the next nodes to execute.
2.  **Single Node Run (`runNode`)**: Executes a specific node and all its prerequisites. This is particularly useful during workflow development for testing individual nodes. The runner recursively ensures that all nodes providing input to the target node have been executed first.

### Data Flow

Data is handled using the `INodeExecutionData` interface:

```typescript
export interface INodeExecutionData {
  json: IDataObject; // Plain JavaScript object containing the item's data
  binary?: {         // Optional binary data
    [key: string]: IBinaryData;
  };
}
```

When a node completes, its output (an array of `INodeExecutionData`) is stored in a map indexed by the node's ID. This data is then provided as input to any subsequent nodes connected via edges.

### Secure Expression Evaluation

Flowser uses **QuickJS** (via `quickjs-emscripten`) to provide a secure, isolated sandbox for evaluating JavaScript expressions within workflow parameters. This ensures that user-defined expressions cannot access the browser's global scope or perform unauthorized actions.

## Expression Evaluation

Workflow parameters can contain dynamic expressions. An expression is identified if the parameter value:
- Starts with an equals sign (e.g., <span v-pre>`={{ $json.id }}`</span>).
- Contains interpolation markers (e.g., <span v-pre>`Processing item {{ $itemIndex }}`</span>).

### Global Objects

The following objects and functions are available within the expression sandbox:

| Object | Description |
| :--- | :--- |
| `$input` | Access to the data entering the current node. |
| `$input.all()` | Returns an array of all input items. |
| `$input.item` | Returns the specific item currently being processed (shorthand for `$input.all()[$itemIndex]`). |
| <span v-pre>`$json`</span> | Shorthand for <span v-pre>`$input.item.json`</span>. This is the most common way to access data fields. |
| `$()` | Node lookup function. Allows accessing data from any node in the workflow by its name or ID. Example: `$('HTTP Request').item.json.status`. |
| `$itemIndex` | The 0-based index of the current item being processed. |

## Node Execution Lifecycle

When the `WorkflowRunner` executes a node, it follows these steps:

1.  **Loading**: The node's logic is retrieved from the `Registry` based on its type.
2.  **Validation**: The node's parameters are validated using the `validateNode` utility. If validation fails, execution is halted with an error.
3.  **Context Preparation**: The runner creates an `IExecuteFunctions` object. This provides the node with a controlled environment to:
    - Access input data.
    - Evaluate its own parameters (which may contain expressions).
    - Access credentials.
    - Query connected nodes or specific node outputs.
4.  **Execution**: The node's `execute` method is called within the prepared context.
5.  **Data Propagation**: The output data returned by the node is captured. In a full run, the runner identifies the next nodes connected to the output ports and triggers their execution with the relevant data branches.

## Execution Persistence

Execution results are managed by the `ExecutionService` (`lib/services/execution-service.ts`) and persisted in **IndexedDB**.

Every time a workflow or a single node is run, a `IWorkflowExecutionResult` object is created and saved. This record includes:
- Workflow ID and metadata.
- Start and end timestamps.
- Overall execution status (`success`, `error`, or `running`).
- Detailed `nodeExecutionResults` for every node that was processed, including their specific input data, output data, and any error messages.

## Error Handling

The execution engine is designed to be resilient and informative:

- **Node Failures**: If a node's `execute` method throws an error, the `WorkflowRunner` catches it, marks that node's status as `error`, and records the error message.
- **Reporting**: Errors are reported to the user via UI notifications (toasts) and are also logged to the execution history in IndexedDB.
- **Graceful Termination**: In a full run, if a node fails, the execution of that branch is halted, but the overall execution result is captured, allowing the user to inspect where the failure occurred.
- **Expression Errors**: If an expression fails to evaluate (e.g., due to a syntax error or accessing a missing property), a warning is logged, and the expression string itself is often returned as a fallback to prevent the entire node from crashing when possible.
