<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { VueFlow, useVueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import {
  type Node,
  type Edge,
  type Connection,
  type NodeMouseEvent,
  MarkerType,
} from "@vue-flow/core";
import { useRoute, RouterLink } from "vue-router";
import { Registry } from "@/lib/nodes/registry";
import NodeDelegate from "@/components/editor/NodeDelegate.vue";
import CustomEdge from "@/components/editor/CustomEdge.vue";
import { toast } from "vue-sonner";
// Remove NodeInspector import
import NodePropertiesModal from "@/components/editor/NodePropertiesModal.vue";
import { WorkflowRunner, ExecutionStatus } from "@/lib/engine/WorkflowRunner";
import { IWorkflow, IWorkflowExecutionResult } from "@/lib/types";
import { WorkflowService } from "@/lib/services/workflow-service";
import { ExecutionService } from "@/lib/services/execution-service";
import ExecutionPanel from "@/components/editor/execution/ExecutionPanel.vue";

import MasterKeyModal from "@/components/editor/MasterKeyModal.vue";
import { SecurityService } from "@/lib/services/security-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Play, Save } from "lucide-vue-next"; // Icons
import { Spinner } from "@/components/ui/spinner";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import "@vue-flow/controls/dist/style.css";
import "@vue-flow/minimap/dist/style.css";

const { t } = useI18n();
const route = useRoute();

// Initial state
const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);
const selectedNode = ref<Node | null>(null);
const logs = ref<any[]>([]); // Keep for basic logs if needed, but mainly use executionResult
const executionResult = ref<IWorkflowExecutionResult | null>(null);
const currentWorkflowId = ref<string | null>(null);
const currentWorkflowName = ref<string>(t("workflowEditor.untitledWorkflow"));
const originalWorkflowName = ref<string>("");
const searchQuery = ref("");
const isSaving = ref(false);
const isExecuting = ref(false);
const isWorkflowActive = ref(false);

const isMasterKeyModalOpen = ref(false);

// Panel state
const isExecutionPanelCollapsed = ref(false);
const bottomPanelRef = ref<InstanceType<typeof ResizablePanel> | null>(null);

const onUnlocked = () => {
  logs.value.push(t("workflowEditor.securityMasterKeySet"));
};

const {
  onConnect,
  addEdges,
  onNodeClick,
  onNodeDoubleClick,
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
    logs.value.push(t("workflowEditor.workflowNotFound", { id }));
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
    toast.warning(t("workflowEditor.connectionTypeMismatch"));
    return;
  }

  // Check connection limits
  // Rules:
  // 1. Tool handles allow multiple connections
  // 2. Main handles (input/output) allow only 1 connection
  // 3. Model/Memory handles allow only 1 connection
  const isMultiConnectionAllowed = (type: string) => type === "tool";

  if (!isMultiConnectionAllowed(sourceType)) {
    const sourceConnections = edges.value.filter(
      (e) =>
        e.source === params.source && e.sourceHandle === params.sourceHandle,
    ).length;

    if (sourceConnections >= 1) {
      toast.warning(t("workflowEditor.connectionLimitReached"));
      return;
    }
  }

  if (!isMultiConnectionAllowed(targetType)) {
    const targetConnections = edges.value.filter(
      (e) =>
        e.target === params.target && e.targetHandle === params.targetHandle,
    ).length;

    if (targetConnections >= 1) {
      toast.warning(t("workflowEditor.connectionLimitReached"));
      return;
    }
  }

  const isMain = sourceType === "main" && targetType === "main";

  addEdges([
    {
      ...params,
      type: "custom",
      markerEnd: isMain
        ? {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          }
        : undefined,
    },
  ]); // Use custom edge
});

onNodeClick((event: NodeMouseEvent) => {
  // Just select for visual feedback, but don't open modal
  selectedNode.value = event.node;
});

const isPropertiesModalOpen = ref(false);

onNodeDoubleClick((event: NodeMouseEvent) => {
  selectedNode.value = event.node;
  isPropertiesModalOpen.value = true;
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

  const defaultParams: Record<string, any> = {};
  for (const prop of nodeType.description.properties) {
    if (prop.default !== undefined) {
      defaultParams[prop.name] = prop.default;
    }
  }

  const newNode: Node = {
    id: `${type}-${Date.now()}`,
    type: "custom",
    position,
    data: {
      label: nodeType.description.displayName,
      nodeType: type,
      ...nodeType.description.defaults,
      ...defaultParams,
    },
  };

  nodes.value.push(newNode);
};

// --- Storage Logic ---

const loadWorkflow = (workflow: IWorkflow) => {
  currentWorkflowId.value = workflow.id;
  currentWorkflowName.value = workflow.name;
  originalWorkflowName.value = workflow.name;
  setNodes(
    workflow.nodes.map((n) => ({
      id: n.id,
      type: "custom",
      position: n.position,
      data: n.data,
    })),
  );
  setEdges(
    workflow.edges.map((e) => {
      // Determine if main connection to set marker
      let isMain = false;
      const sourceNode = workflow.nodes.find((n) => n.id === e.source);
      const targetNode = workflow.nodes.find((n) => n.id === e.target);

      if (sourceNode && targetNode) {
        const sourceType = getPortType(
          sourceNode.data.nodeType,
          e.sourceHandle || "",
          "outputs",
        );
        const targetType = getPortType(
          targetNode.data.nodeType,
          e.targetHandle || "",
          "inputs",
        );
        isMain = sourceType === "main" && targetType === "main";
      }

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: "custom", // Force custom type
        markerEnd: isMain
          ? {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            }
          : undefined,
      };
    }),
  );
  isWorkflowActive.value = workflow.active;
  logs.value.push(t("workflowEditor.loadedWorkflow") + " " + workflow.name);
};

const saveWorkflow = async () => {
  const workflowId = currentWorkflowId.value || crypto.randomUUID();
  let name = currentWorkflowName.value;
  if (!currentWorkflowId.value) {
    if (!name || name.trim() === "") {
      name = t("workflowEditor.untitledWorkflow");
      currentWorkflowName.value = name;
    }
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
    active: isWorkflowActive.value,
    previewSvg: "",
  };

  // Try to capture MiniMap SVG
  try {
    const miniMapSvg = document.querySelector(".vue-flow__minimap svg");
    if (miniMapSvg) {
      // Clone it so we don't affect the live one
      const clone = miniMapSvg.cloneNode(true) as SVGElement;

      // We can also ensure it has width/height or viewBox set if needed.
      // Usually minimap svg behaves well.
      // Serialize to string
      workflow.previewSvg = new XMLSerializer().serializeToString(clone);
    }
  } catch (e) {
    console.error("Failed to capture minimap screenshot", e);
  }

  const sanitizedWorkflow = JSON.parse(JSON.stringify(workflow));

  isSaving.value = true;
  try {
    await WorkflowService.saveWorkflow(sanitizedWorkflow);
    currentWorkflowId.value = workflowId;
    originalWorkflowName.value = name;
    logs.value.push(t("workflowEditor.savedWorkflow") + " " + name);
    toast.success(t("workflowEditor.savedWorkflow") + " " + name);
  } finally {
    isSaving.value = false;
  }
};

const onNameBlur = () => {
  if (currentWorkflowName.value !== originalWorkflowName.value) {
    saveWorkflow();
  }
};

const createNewWorkflow = () => {
  currentWorkflowId.value = null;
  currentWorkflowName.value = t("workflowEditor.newWorkflow");
  originalWorkflowName.value = currentWorkflowName.value;
  setNodes([]);
  setEdges([]);
  isWorkflowActive.value = false;
  logs.value.push(t("workflowEditor.createdNewWorkflow"));
};

// Let's redefine runWorkflow
const runWorkflow = async () => {
  console.log("Running workflow...");
  logs.value = [];
  executionResult.value = null;
  // Ensure panel is open when running
  isExecutionPanelCollapsed.value = false;

  const workflow: IWorkflow = {
    id: currentWorkflowId.value || "temp-workflow",
    name: currentWorkflowName.value,
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
    active: isWorkflowActive.value,
    previewSvg: "",
  };

  // Reset execution status for all nodes
  nodes.value.forEach((node) => {
    node.data.executionStatus = undefined;
    node.data.executionError = undefined;
  });

  const runner = new WorkflowRunner(workflow, (nodeId, status) => {
    const node = findNode(nodeId);
    if (node) {
      node.data.executionStatus = status;
      if (status === "running") {
        // Clear previous error if re-running
        node.data.executionError = undefined;
      }
    }
  });

  isExecuting.value = true;
  try {
    const result = await runner.run();
    executionResult.value = result;
    await ExecutionService.saveExecution(result);
    logs.value.push(t("workflowEditor.executionFinished"));
  } catch (e: any) {
    console.error(e);
    logs.value.push(`Error: ${e.message}`);
  } finally {
    isExecuting.value = false;
  }
};

const onActiveToggle = async (checked: boolean) => {
  isWorkflowActive.value = checked;

  if (currentWorkflowId.value) {
    try {
      await WorkflowService.updateWorkflowStatus(
        currentWorkflowId.value,
        checked,
      );
    } catch (e) {
      console.error(e);
      // Revert if failed
      isWorkflowActive.value = !checked;
      toast.error(t("common.error"));
    }
  }
};

const toggleExecutionPanel = () => {
  const panel = bottomPanelRef.value;
  if (panel) {
    if (isExecutionPanelCollapsed.value) {
      panel.expand();
    } else {
      panel.collapse();
    }
  }
};
</script>

<template>
  <div class="h-full w-full relative flex flex-col">
    <!-- Header / Toolbar (Top) -->
    <div
      class="absolute top-4 left-4 z-10 flex items-center gap-2 bg-card p-2 rounded-md shadow border"
    >
      <Breadcrumb class="mr-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink as-child>
              <RouterLink to="/workflows">
                {{ t("workflows.title") }}
              </RouterLink>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </BreadcrumbList>
      </Breadcrumb>
      <Input
        v-model="currentWorkflowName"
        @blur="onNameBlur"
        class="h-8 font-semibold px-2 bg-transparent border-transparent shadow-none hover:border-input focus:border-input w-[200px]"
      />
      <div class="h-4 w-px bg-border mx-2"></div>
      <Button
        size="sm"
        variant="outline"
        @click="saveWorkflow"
        :disabled="isSaving"
        class="cursor-pointer"
      >
        <Spinner v-if="isSaving" class="w-4 h-4 mr-1" />
        <Save v-else class="w-4 h-4 mr-1" />
        {{ t("common.save") }}
      </Button>
      <Button
        size="sm"
        @click="runWorkflow"
        :disabled="isExecuting"
        class="cursor-pointer"
      >
        <Spinner v-if="isExecuting" class="w-4 h-4 mr-1" />
        <Play v-else class="w-4 h-4 mr-1" />
        {{ t("workflowEditor.execute") }}
      </Button>

      <div class="h-4 w-px bg-border mx-2"></div>

      <div class="flex items-center space-x-2">
        <Switch
          v-model="isWorkflowActive"
          id="workflow-active"
          @update:model-value="onActiveToggle"
        />
        <Label for="workflow-active" class="text-sm font-medium">{{
          t("workflows.active")
        }}</Label>
      </div>
    </div>

    <ResizablePanelGroup
      direction="vertical"
      class="flex-1 w-full h-full relative"
      autoSaveId="workflow-editor"
    >
      <ResizablePanel :default-size="75" :min-size="25" class="relative">
        <!-- Canvas -->
        <main
          class="h-full w-full bg-background relative"
          @dragover="onDragOver"
          @drop="onDrop"
        >
          <VueFlow
            v-model:nodes="nodes"
            v-model:edges="edges"
            class="h-full w-full"
            :default-zoom="1"
            :min-zoom="0.2"
            :max-zoom="4"
          >
            <template #node-custom="props">
              <NodeDelegate :id="props.id" :data="props.data" />
            </template>

            <template #edge-custom="props">
              <CustomEdge v-bind="props" />
            </template>

            <Background pattern-color="#aaa" :gap="16" />
            <Controls position="bottom-left" />
            <MiniMap position="bottom-left" />
          </VueFlow>
        </main>

        <!-- Floating Node Panel (Right) -->
        <aside
          class="absolute top-20 right-4 z-10 w-64 bg-card border rounded-lg shadow-lg flex flex-col max-h-[calc(100%-8rem)]"
          v-if="!selectedNode"
        >
          <!-- ... (Content of node panel) ... -->
          <div class="p-4 border-b">
            <h3 class="font-semibold mb-2">
              {{ t("workflowEditor.buildWorkflow") }}
            </h3>
            <div class="relative">
              <Search
                class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
              />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('workflowEditor.searchNodes')"
                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pl-9 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-2">
            <div
              v-for="node in Registry.getAll()"
              :key="node.description.name"
              class="cursor-grab flex items-center gap-3 rounded-md border bg-popover p-3 hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm"
              draggable="true"
              @dragstart="
                (event) =>
                  event.dataTransfer?.setData(
                    'application/vueflow',
                    node.description.name,
                  )
              "
            >
              <div
                class="flex h-8 w-8 items-center justify-center rounded bg-muted"
              >
                <!-- Icon support if available -->
                <component
                  :is="node.description.icon || Plus"
                  class="h-4 w-4"
                />
              </div>
              <div class="flex flex-col text-left">
                <span class="text-sm font-medium">{{
                  node.description.displayName
                }}</span>
              </div>
            </div>
          </div>
        </aside>
      </ResizablePanel>

      <ResizableHandle v-show="executionResult" with-handle />

      <ResizablePanel
        v-show="executionResult"
        ref="bottomPanelRef"
        :default-size="25"
        :max-size="75"
        :collapsible="true"
        @expand="isExecutionPanelCollapsed = false"
        @collapse="isExecutionPanelCollapsed = true"
        class="bg-background border-t flex flex-col min-h-10"
      >
        <ExecutionPanel
          v-if="executionResult"
          :execution-result="executionResult"
          :is-collapsed="isExecutionPanelCollapsed"
          class="flex-1 min-h-0"
          @close="executionResult = null"
          @toggle-collapse="toggleExecutionPanel"
        />
      </ResizablePanel>
    </ResizablePanelGroup>

    <!-- Node Properties Modal -->
    <NodePropertiesModal
      v-if="selectedNode"
      :is-open="isPropertiesModalOpen"
      :node="selectedNode"
      :execution-result="executionResult"
      @close="isPropertiesModalOpen = false"
      @update:data="(newData) => (selectedNode!.data = newData)"
    />

    <!-- UI Modals -->
    <MasterKeyModal
      :is-open="isMasterKeyModalOpen"
      @close="isMasterKeyModalOpen = false"
      @unlocked="onUnlocked"
    />
  </div>
</template>

<style>
/* Adjustments for controls position if needed */
.vue-flow__controls {
  display: flex;
  flex-direction: row;
}

.vue-flow__controls-button {
  border: none;
  border-right: 1px solid #eee;
}

.vue-flow__controls-button:last-child {
  border-right: none;
}

/* Place minimap above controls */
.vue-flow__minimap {
  bottom: 40px !important; /* Force override of .vue-flow__panel.bottom */
  transform: none; /* Reset potential defaults */
}
</style>
