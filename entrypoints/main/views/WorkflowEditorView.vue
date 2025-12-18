<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { VueFlow, useVueFlow } from "@vue-flow/core";
import type { Node, Edge, Connection, NodeMouseEvent } from "@vue-flow/core";
import { useRoute } from "vue-router";
import { Registry } from "@/lib/nodes/registry";
import NodeDelegate from "@/components/editor/NodeDelegate.vue";
import NodeInspector from "@/components/editor/NodeInspector.vue";
import { WorkflowRunner } from "@/lib/engine/WorkflowRunner";
import { IWorkflow } from "@/lib/types";
import { WorkflowService } from "@/lib/services/workflow-service";

import MasterKeyModal from "@/components/editor/MasterKeyModal.vue";
import { SecurityService } from "@/lib/services/security-service";
import { Button } from "@/components/ui/button";

const route = useRoute();

// Initial state
const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);
const selectedNode = ref<Node | null>(null);
const logs = ref<any[]>([]);
const currentWorkflowId = ref<string | null>(null);
const currentWorkflowName = ref<string>("Untitled Workflow");

const isMasterKeyModalOpen = ref(false);

const onUnlocked = () => {
  logs.value.push("Security: Master Key Set");
};

const {
  onConnect,
  addEdges,
  onNodeClick,
  onPaneClick,
  setNodes,
  setEdges,
  findNode,
} = useVueFlow();

// Load workflow on mount or route change
const loadInitWorkflow = async () => {
  const id = route.params.id as string;
  if (!id || id === "new") {
    createNewWorkflow();
    return;
  }

  const workflow = await WorkflowService.getWorkflow(id);
  if (workflow) {
    loadWorkflow(workflow);
  } else {
    logs.value.push(`Workflow ${id} not found.`);
  }
};

onMounted(async () => {
  await loadInitWorkflow();

  // Try to restore master key
  const restored = await SecurityService.restoreFromSession();
  if (!restored) {
    isMasterKeyModalOpen.value = true;
  }
});

watch(
  () => route.params.id,
  async () => {
    await loadInitWorkflow();
  },
);

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
  currentWorkflowName.value = workflow.name;
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
  // Simple rename for now, ideally in a dialog or title bar
  let name = currentWorkflowName.value;
  if (!currentWorkflowId.value) {
    name =
      prompt("Workflow Name", currentWorkflowName.value) || "Untitled Workflow";
    currentWorkflowName.value = name;
  }

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

  const sanitizedWorkflow = JSON.parse(JSON.stringify(workflow));
  await WorkflowService.saveWorkflow(sanitizedWorkflow);
  currentWorkflowId.value = workflowId;
  logs.value.push(`Saved workflow: ${name}`);
};

const createNewWorkflow = () => {
  currentWorkflowId.value = null;
  currentWorkflowName.value = "New Workflow";
  setNodes([]);
  setEdges([]);
  logs.value.push("Created new workflow");
};

// --- Execution Logic ---

const runWorkflow = async () => {
  console.log("Running workflow...");
  logs.value = [];

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
  <div class="h-full flex flex-col md:flex-row overflow-hidden">
    <!-- Local Sidebar (Nodes) -->
    <aside
      class="w-64 border-r bg-card p-4 flex flex-col gap-4 overflow-y-auto"
    >
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-lg truncate">
          {{ currentWorkflowName }}
        </h2>
      </div>
      <div>
        <h2 class="mb-2 text-sm font-semibold">Nodes</h2>
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

      <div class="mt-auto space-y-2">
        <Button variant="outline" class="w-full" @click="saveWorkflow"
          >Save</Button
        >
        <Button class="w-full" @click="runWorkflow">Run Workflow</Button>
      </div>

      <div class="border-t pt-2 min-h-[100px]">
        <h3 class="text-xs font-semibold mb-1">Logs</h3>
        <div
          class="text-xs font-mono text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto"
        >
          <div v-for="(log, i) in logs" :key="i">{{ log }}</div>
        </div>
      </div>
    </aside>

    <!-- Canvas -->
    <main
      class="flex-1 relative bg-background"
      @dragover="onDragOver"
      @drop="onDrop"
    >
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

    <!-- UI Modals -->
    <MasterKeyModal
      :is-open="isMasterKeyModalOpen"
      @close="isMasterKeyModalOpen = false"
      @unlocked="onUnlocked"
    />

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
@import "@vue-flow/core/dist/style.css";
@import "@vue-flow/core/dist/theme-default.css";
</style>
