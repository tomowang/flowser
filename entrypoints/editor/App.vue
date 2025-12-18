<script setup lang="ts">
import { ref, onMounted } from "vue";
import { VueFlow, useVueFlow } from "@vue-flow/core";
import type { Node, Edge, Connection, NodeMouseEvent } from "@vue-flow/core";
import { Registry } from "@/lib/nodes/registry";
import NodeDelegate from "@/components/editor/NodeDelegate.vue";
import NodeInspector from "@/components/editor/NodeInspector.vue";
import { WorkflowRunner } from "@/lib/engine/WorkflowRunner";
import { IWorkflow } from "@/lib/types";
import { WorkflowService } from "@/lib/services/workflow-service";

// Initial state
const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);
const selectedNode = ref<Node | null>(null);
const logs = ref<any[]>([]);
const savedWorkflows = ref<IWorkflow[]>([]);
const currentWorkflowId = ref<string | null>(null);

const {
  onConnect,
  addEdges,
  onNodeClick,
  onPaneClick,
  setNodes,
  setEdges,
  findNode,
} = useVueFlow();

// Load available workflows on mount
onMounted(async () => {
  savedWorkflows.value = await WorkflowService.getAllWorkflows();
});

const getPortType = (
  nodeType: string,
  portName: string,
  kind: "inputs" | "outputs",
): string => {
  const def = Registry.get(nodeType);
  if (!def) return "main";

  const ports = def.description[kind];
  const port = ports.find((p) => p.name === portName);

  if (!port) return "";
  return port.type;
};

onConnect((params: Connection) => {
  if (!params.source || !params.target) return;

  const sourceNode = findNode(params.source);
  const targetNode = findNode(params.target);

  if (!sourceNode || !targetNode) return;

  const sourceType = getPortType(
    sourceNode.data.nodeType,
    params.sourceHandle || "",
    "outputs",
  );
  const targetType = getPortType(
    targetNode.data.nodeType,
    params.targetHandle || "",
    "inputs",
  );

  if (sourceType !== targetType) {
    // Could show toast notification here
    console.warn(
      `Connection rejected: Cannot connect ${sourceType} to ${targetType}`,
    );
    return;
  }

  addEdges([params]);
});

onNodeClick((event: NodeMouseEvent) => {
  selectedNode.value = event.node;
});

onPaneClick(() => {
  selectedNode.value = null;
});

const onDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
};

const onDrop = (event: DragEvent) => {
  const type = event.dataTransfer?.getData("application/vueflow");
  if (!type) return;

  const nodeType = Registry.get(type);
  if (!nodeType) return;

  const position = {
    x: event.clientX - 250, // basic offset
    y: event.clientY - 50,
  };

  const newNode: Node = {
    id: `${type}-${Date.now()}`,
    type: "custom",
    position,
    data: {
      label: nodeType.description.displayName,
      nodeType: type,
      ...nodeType.description.defaults,
    },
  };

  nodes.value.push(newNode);
};

// --- Storage Logic ---

const loadWorkflow = (workflow: IWorkflow) => {
  currentWorkflowId.value = workflow.id;
  // Map persistent format back to Vue Flow
  setNodes(
    workflow.nodes.map((n) => ({
      id: n.id,
      type: "custom",
      position: n.position,
      data: n.data,
    })),
  );
  setEdges(
    workflow.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    })),
  );
  logs.value.push(`Loaded workflow: ${workflow.name}`);
};

const saveWorkflow = async () => {
  const workflowId = currentWorkflowId.value || crypto.randomUUID();
  const name = prompt("Workflow Name", "My Workflow") || "Untitled Workflow";

  // Construct IWorkflow
  const workflow: IWorkflow = {
    id: workflowId,
    name: name,
    nodes: nodes.value.map((n) => ({
      id: n.id,
      type: n.data.nodeType,
      position: n.position,
      data: n.data,
    })),
    edges: edges.value.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? undefined,
      targetHandle: e.targetHandle ?? undefined,
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    active: false,
  };

  // Sanitize to remove Vue proxies and non-serializable objects
  const sanitizedWorkflow = JSON.parse(JSON.stringify(workflow));
  await WorkflowService.saveWorkflow(sanitizedWorkflow);
  currentWorkflowId.value = workflowId;
  savedWorkflows.value = await WorkflowService.getAllWorkflows();
  logs.value.push(`Saved workflow: ${name}`);
};

const createNewWorkflow = () => {
  currentWorkflowId.value = null;
  setNodes([]);
  setEdges([]);
  logs.value.push("Created new workflow");
};

// --- Execution Logic ---

const runWorkflow = async () => {
  console.log("Running workflow...");
  logs.value = [];

  // Construct IWorkflow from Vue Flow state
  const workflow: IWorkflow = {
    id: currentWorkflowId.value || "temp-workflow",
    name: "Current Workflow",
    nodes: nodes.value.map((n) => ({
      id: n.id,
      type: n.data.nodeType,
      position: n.position,
      data: n.data,
    })),
    edges: edges.value.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? undefined,
      targetHandle: e.targetHandle ?? undefined,
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    active: false,
  };

  const runner = new WorkflowRunner(workflow);

  try {
    await runner.run();
    logs.value.push("Execution finished successfully.");
  } catch (e: any) {
    console.error(e);
    logs.value.push(`Error: ${e.message}`);
  }
};
</script>

<template>
  <div
    class="flex h-screen w-screen overflow-hidden bg-background text-foreground"
  >
    <!-- Sidebar -->
    <aside class="w-64 border-r bg-card p-4 flex flex-col gap-4">
      <!-- Actions -->
      <div class="flex gap-2">
        <button
          @click="createNewWorkflow"
          class="flex-1 text-xs border rounded px-2 py-1 hover:bg-accent"
        >
          New
        </button>
        <button
          @click="saveWorkflow"
          class="flex-1 text-xs border rounded px-2 py-1 hover:bg-accent"
        >
          Save
        </button>
      </div>

      <!-- Workflows List (Simple) -->
      <div class="border-b pb-2">
        <h2 class="mb-2 text-sm font-semibold">Saved Workflows</h2>
        <div class="max-h-32 overflow-y-auto space-y-1">
          <div
            v-for="wf in savedWorkflows"
            :key="wf.id"
            @click="loadWorkflow(wf)"
            class="cursor-pointer text-xs p-1 rounded hover:bg-accent truncate"
            :class="{ 'bg-accent': currentWorkflowId === wf.id }"
          >
            {{ wf.name }}
          </div>
          <div
            v-if="savedWorkflows.length === 0"
            class="text-xs text-muted-foreground italic"
          >
            No workflows saved.
          </div>
        </div>
      </div>

      <div>
        <h2 class="mb-2 text-lg font-semibold">Nodes</h2>
        <div class="space-y-2">
          <div
            v-for="node in Registry.getAll()"
            :key="node.description.name"
            class="cursor-grab rounded border bg-popover p-2 hover:bg-accent text-sm shadow-sm"
            draggable="true"
            @dragstart="
              (event) =>
                event.dataTransfer?.setData(
                  'application/vueflow',
                  node.description.name,
                )
            "
          >
            {{ node.description.displayName }}
          </div>
        </div>
      </div>

      <div class="pt-4 border-t mt-auto">
        <button
          @click="runWorkflow"
          class="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Run Workflow
        </button>
      </div>

      <div class="flex-1 overflow-auto border-t pt-2 min-h-[100px]">
        <h3 class="text-xs font-semibold mb-1">Logs</h3>
        <div
          class="text-xs font-mono text-muted-foreground whitespace-pre-wrap"
        >
          <div v-for="(log, i) in logs" :key="i">{{ log }}</div>
        </div>
      </div>
    </aside>

    <!-- Canvas -->
    <main class="flex-1 relative" @dragover="onDragOver" @drop="onDrop">
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        class="h-full w-full"
      >
        <template #node-custom="props">
          <NodeDelegate :data="props.data" />
        </template>
      </VueFlow>
    </main>

    <!-- Inspector -->
    <aside class="w-80 border-l bg-card p-4 overflow-y-auto">
      <NodeInspector
        v-if="selectedNode"
        :node="selectedNode"
        @update:data="(newData) => (selectedNode!.data = newData)"
      />
      <div v-else class="text-muted-foreground text-sm">
        Select a node to edit properties.
      </div>
    </aside>
  </div>
</template>

<style>
/* Ensure basics for vue flow */
@import "@vue-flow/core/dist/style.css";
@import "@vue-flow/core/dist/theme-default.css";
</style>
