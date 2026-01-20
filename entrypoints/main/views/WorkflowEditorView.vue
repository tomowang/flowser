<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
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
  type NodeChange,
  type EdgeChange,
  type VueFlowStore,
} from "@vue-flow/core";
import { useRoute, RouterLink } from "vue-router";
import { Registry } from "@/lib/nodes/registry";
import { validateNode } from "@/lib/utils/validation";
import NodeDelegate from "@/components/editor/NodeDelegate.vue";
import CustomEdge from "@/components/editor/CustomEdge.vue";
import { useWorkflowHistory } from "@/lib/composables/useWorkflowHistory";
import { toast } from "vue-sonner";
// Remove NodeInspector import
import NodePropertiesModal from "@/components/editor/NodePropertiesModal.vue";
import { WorkflowRunner, ExecutionStatus } from "@/lib/engine/WorkflowRunner";
import { IWorkflow, IWorkflowExecutionResult, INodeType } from "@/lib/types";
import { WorkflowService } from "@/lib/services/workflow-service";
import { ExecutionService } from "@/lib/services/execution-service";
import ExecutionPanel from "@/components/editor/execution/ExecutionPanel.vue";

import MasterKeyModal from "@/components/editor/MasterKeyModal.vue";
import { SecurityService } from "@/lib/services/security-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Play,
  Save,
  ChevronRight,
  ChevronDown,
  Undo2,
  Redo2,
} from "lucide-vue-next"; // Icons
import { Spinner } from "@/components/ui/spinner";
import { useMagicKeys } from "@vueuse/core";
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
const collapsedGroups = ref<Record<string, boolean>>({
  core: true,
  trigger: true,

  browser: true,
  page_action: true,
  ai: true,
  other: true,
});

const toggleGroup = (group: string) => {
  collapsedGroups.value[group] = !collapsedGroups.value[group];
};

const groupedNodes = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  const groups: Record<string, INodeType[]> = {
    core: [],
    trigger: [],

    browser: [],
    page_action: [],
    ai: [],
    other: [],
  };

  const allNodes = Registry.getAll();
  // Sort by displayName
  const sortedNodes = allNodes.sort((a, b) =>
    a.description.displayName.localeCompare(b.description.displayName),
  );

  for (const node of sortedNodes) {
    if (query && !node.description.displayName.toLowerCase().includes(query)) {
      continue;
    }

    const groupName = node.description.group?.[0] || "other";
    if (Array.isArray(groups[groupName])) {
      groups[groupName].push(node);
    } else {
      groups["other"].push(node);
    }
  }

  // Filter out empty groups and return only relevant ones
  const result: Record<string, INodeType[]> = {};
  const order = ["core", "trigger", "browser", "page_action", "ai", "other"];

  for (const key of order) {
    if (groups[key] && groups[key].length > 0) {
      result[key] = groups[key];
    }
  }

  return result;
});

const {
  state: workflowState,
  initState,
  updateState,
  updateStateDebounced,
  undo,
  redo,
  canUndo,
  canRedo,
} = useWorkflowHistory();

const nodes = computed(() => workflowState.value.nodes);
const edges = computed(() => workflowState.value.edges);

const selectedNode = ref<Node | null>(null);
const logs = ref<any[]>([]); // Keep for basic logs if needed, but mainly use executionResult
const executionResult = ref<IWorkflowExecutionResult | null>(null);
const currentWorkflowId = ref<string | null>(null);
const currentWorkflowName = ref<string>(t("workflowEditor.untitledWorkflow"));
const originalWorkflowName = ref<string>("");
const searchQuery = ref("");

watch(searchQuery, (newVal) => {
  if (newVal.trim()) {
    // Expand all groups when searching
    Object.keys(collapsedGroups.value).forEach((key) => {
      collapsedGroups.value[key] = false;
    });
  } else {
    // Collapse all groups when search is cleared
    Object.keys(collapsedGroups.value).forEach((key) => {
      collapsedGroups.value[key] = true;
    });
  }
});

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

const vueFlowInstance = ref<VueFlowStore | null>(null);

const onPaneReady = (instance: VueFlowStore) => {
  vueFlowInstance.value = instance;
};

const findNode = (id: string) => {
  return workflowState.value.nodes.find((n) => n.id === id);
};

const { space } = useMagicKeys();

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

const onConnect = (params: Connection) => {
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

  const newEdge = {
    ...params,
    id: `e-${Date.now()}`,
    type: "custom",
    markerEnd: isMain
      ? {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        }
      : undefined,
  };

  const nextEdges = [...workflowState.value.edges, newEdge];
  updateState(workflowState.value.nodes, nextEdges);
};

const onNodesChange = (changes: NodeChange[]) => {
  if (!vueFlowInstance.value) return;

  // Apply changes to the internal Vue Flow store
  vueFlowInstance.value.applyNodeChanges(changes);

  // Sync back to our managed state
  // We access the nodes property from the store instance (it is a Ref to the array or the array itself in unref context)
  // Since we are adding logic, assuming instance.nodes is the way to access.
  // Actually, VueFlowStore has `nodes` as Ref<GraphNode[]> and `edges` as Ref<GraphEdge[]>.
  // We need to unref it or access .value if it's a ref.
  // But wait, the previous error `GraphNode[] has no call signatures` implies it IS the array.
  // So accessing `vueFlowInstance.value.nodes` might be the Ref?
  // Let's rely on standard object conversion which is safer: instance.toObject()
  const nextNodes = vueFlowInstance.value.toObject().nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: { ...n.position },
    data: { ...n.data },
  })) as Node[];

  const nextEdges = workflowState.value.edges;

  const hasPositionChange = changes.some((c) => c.type === "position");
  const hasStructuralChange = changes.some(
    (c) => c.type === "add" || c.type === "remove",
  );

  if (hasStructuralChange) {
    updateState(nextNodes, nextEdges);
  } else if (hasPositionChange) {
    updateStateDebounced(nextNodes, nextEdges);
  } else {
    workflowState.value.nodes = nextNodes;
  }
};

const onEdgesChange = (changes: EdgeChange[]) => {
  if (!vueFlowInstance.value) return;

  vueFlowInstance.value.applyEdgeChanges(changes);

  const nextEdges = vueFlowInstance.value.toObject().edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: e.type,
    data: { ...e.data },
    markerEnd: e.markerEnd,
  })) as Edge[];

  const nextNodes = workflowState.value.nodes;

  const hasStructuralChange = changes.some(
    (c) => c.type === "add" || c.type === "remove",
  );

  if (hasStructuralChange) {
    updateState(nextNodes, nextEdges);
  } else {
    workflowState.value.edges = nextEdges;
  }
};

const onNodeClick = (event: NodeMouseEvent) => {
  // Just select for visual feedback, but don't open modal
  selectedNode.value = event.node;
};

const isPropertiesModalOpen = ref(false);

const onNodeDoubleClick = (event: NodeMouseEvent) => {
  selectedNode.value = event.node;
  isPropertiesModalOpen.value = true;
};

const onPaneClick = () => {
  selectedNode.value = null;
};

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

  const getUniqueNodeName = (baseName: string) => {
    let name = baseName;
    let counter = 1;
    // Helper to check if name exists
    const exists = (n: string) =>
      nodes.value.some((node) => node.data.label === n);

    while (exists(name)) {
      name = `${baseName} (${counter})`;
      counter++;
    }
    return name;
  };

  const newNode: Node = {
    id: `${type}-${Date.now()}`,
    type: "custom",
    position,
    data: {
      label: getUniqueNodeName(nodeType.description.displayName),
      nodeType: type,
      ...nodeType.description.defaults,
      ...defaultParams,
    },
  };

  nodes.value.push(newNode); // Note: nodes is computed, but we need to update state
  // Wait, nodes is computed, so we cannot push to it directly if it was just a getter.
  // But wait, workflowState.value.nodes IS the array. We can modify the array if we access the value.
  // BUT the computed I defined: const nodes = computed(() => workflowState.value.nodes);
  // nodes.value returns the array instance.
  // HOWEVER, best practice is to update state properly.
  const nextNodes = [...workflowState.value.nodes, newNode];
  updateState(nextNodes, workflowState.value.edges);
};

// --- Storage Logic ---

const lastSavedSnapshot = ref<string>("");

const getWorkflowSnapshot = (
  name: string,
  currentNodes: any[],
  currentEdges: any[],
  isLiveState: boolean,
) => {
  const snapshot = {
    name: name,
    nodes: currentNodes.map((n) => {
      // Exclude execution stats from snapshot to avoid triggering "hasChanges" when running
      const { executionStatus, executionError, ...data } = n.data || {};
      return {
        id: n.id,
        type: isLiveState ? n.data?.nodeType : n.type,
        position: { x: n.position.x, y: n.position.y },
        data,
      };
    }),
    edges: currentEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || undefined,
      targetHandle: e.targetHandle || undefined,
    })),
  };
  return JSON.stringify(snapshot);
};

const hasChanges = computed(() => {
  const currentSnapshot = getWorkflowSnapshot(
    currentWorkflowName.value,
    nodes.value,
    edges.value,
    true,
  );
  return currentSnapshot !== lastSavedSnapshot.value;
});

const loadWorkflow = (workflow: IWorkflow) => {
  currentWorkflowId.value = workflow.id;
  currentWorkflowName.value = workflow.name;
  originalWorkflowName.value = workflow.name;
  currentWorkflowId.value = workflow.id;
  currentWorkflowName.value = workflow.name;
  originalWorkflowName.value = workflow.name;

  const loadedNodes = workflow.nodes.map((n) => ({
    id: n.id,
    type: "custom",
    position: n.position,
    data: n.data,
  }));

  const loadedEdges = workflow.edges.map((e: any) => {
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
  });

  initState(loadedNodes, loadedEdges);
  isWorkflowActive.value = workflow.active;
  lastSavedSnapshot.value = getWorkflowSnapshot(
    workflow.name,
    workflow.nodes,
    workflow.edges,
    false,
  );
  logs.value.push(t("workflowEditor.loadedWorkflow") + " " + workflow.name);

  // Validate nodes on load
  let invalidCount = 0;
  for (const node of workflow.nodes) {
    const validationResult = validateNode(node);
    if (!validationResult.isValid) {
      invalidCount++;
      const nodeName = node.data.label || node.type;
      logs.value.push(
        `Validation Warning [${nodeName}]: ${validationResult.errors.join(", ")}`,
      );
    }
  }

  if (invalidCount > 0) {
    logs.value.push(
      `Workflow loaded with ${invalidCount} invalid node(s). Check details above.`,
    );
  }
};

const saveWorkflow = async () => {
  if (!hasChanges.value && currentWorkflowId.value) return; // Prevent saving if no changes and not new

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
    nodes: nodes.value.map((n) => {
      const { executionStatus, executionError, ...data } = n.data;
      return {
        id: n.id,
        type: n.data.nodeType,
        position: n.position,
        data,
      };
    }),
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
    // Update snapshot after successful save
    lastSavedSnapshot.value = getWorkflowSnapshot(
      name,
      nodes.value,
      edges.value,
      true,
    );
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
  currentWorkflowId.value = null;
  currentWorkflowName.value = t("workflowEditor.newWorkflow");
  originalWorkflowName.value = currentWorkflowName.value;
  initState([], []); // Clear state
  isWorkflowActive.value = false;
  lastSavedSnapshot.value = getWorkflowSnapshot(
    currentWorkflowName.value,
    [],
    [],
    true,
  );
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
    if (e.message === "No trigger node found") {
      toast.warning(t("workflowEditor.noTriggerNode"));
    }
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
        class="h-8 font-semibold px-2 bg-transparent border-transparent shadow-none hover:border-input focus:border-input w-[200px]"
        @blur="onNameBlur"
      />
      <div class="h-4 w-px bg-border mx-2"></div>
      <div class="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          :disabled="!canUndo"
          class="h-8 w-8"
          @click="undo"
        >
          <Undo2 class="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          :disabled="!canRedo"
          class="h-8 w-8"
          @click="redo"
        >
          <Redo2 class="h-4 w-4" />
        </Button>
      </div>
      <div class="h-4 w-px bg-border mx-2"></div>
      <Button
        size="sm"
        variant="outline"
        :disabled="isSaving || !hasChanges"
        class="cursor-pointer"
        @click="saveWorkflow"
      >
        <Spinner v-if="isSaving" class="w-4 h-4 mr-1" />
        <Save v-else class="w-4 h-4 mr-1" />
        {{ t("common.save") }}
      </Button>
      <Button
        size="sm"
        :disabled="isExecuting"
        class="cursor-pointer"
        @click="runWorkflow"
      >
        <Spinner v-if="isExecuting" class="w-4 h-4 mr-1" />
        <Play v-else class="w-4 h-4 mr-1" />
        {{ t("workflowEditor.execute") }}
      </Button>

      <div class="h-4 w-px bg-border mx-2"></div>

      <div class="flex items-center space-x-2">
        <Switch
          id="workflow-active"
          v-model="isWorkflowActive"
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
      auto-save-id="workflow-editor"
    >
      <ResizablePanel :default-size="75" :min-size="25" class="relative">
        <!-- Canvas -->
        <main
          class="h-full w-full bg-background relative"
          @dragover="onDragOver"
          @drop="onDrop"
        >
          <VueFlow
            :nodes="nodes"
            :edges="edges"
            :apply-default="false"
            class="h-full w-full"
            :default-zoom="1"
            :min-zoom="0.2"
            :max-zoom="4"
            :pan-on-drag="false"
            :pan-on-scroll="true"
            :zoom-on-scroll="false"
            :pan-activation-key-code="'Space'"
            :selection-key-code="true"
            :multi-selection-key-code="['Meta', 'Control']"
            :nodes-draggable="!space"
            :nodes-connectable="!space"
            :elements-selectable="!space"
            :class="{ 'panning-mode': space }"
            @pane-ready="onPaneReady"
            @nodes-change="onNodesChange"
            @edges-change="onEdgesChange"
            @connect="onConnect"
            @node-click="onNodeClick"
            @node-double-click="onNodeDoubleClick"
            @pane-click="onPaneClick"
          >
            <template #node-custom="props">
              <NodeDelegate
                :id="props.id"
                :data="props.data"
                :selected="props.selected"
              />
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
          v-if="!selectedNode"
          class="absolute top-20 right-4 z-10 w-64 bg-card border rounded-lg shadow-lg flex flex-col max-h-[calc(100%-8rem)]"
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
              v-for="(nodes, groupName) in groupedNodes"
              :key="groupName"
              class="space-y-1"
            >
              <!-- Group Header -->
              <div
                class="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted/50 cursor-pointer select-none text-sm font-semibold text-muted-foreground"
                @click="toggleGroup(groupName)"
              >
                <ChevronRight
                  v-if="collapsedGroups[groupName]"
                  class="h-4 w-4"
                />
                <ChevronDown v-else class="h-4 w-4" />
                <span>{{ t(`workflowEditor.groups.${groupName}`) }}</span>
              </div>

              <!-- Group Content -->
              <div v-show="!collapsedGroups[groupName]" class="space-y-2 pl-2">
                <div
                  v-for="node in nodes"
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
                    <component
                      :is="node.description.icon || Plus"
                      class="h-4 w-4 text-foreground/70"
                    />
                  </div>
                  <div class="flex flex-col text-left">
                    <span class="text-sm font-medium">{{
                      node.description.displayName
                    }}</span>
                  </div>
                </div>
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
        class="bg-background border-t flex flex-col min-h-10"
        @expand="isExecutionPanelCollapsed = false"
        @collapse="isExecutionPanelCollapsed = true"
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

<style scoped>
/* Adjustments for controls position if needed */
.vue-flow__controls {
  display: flex;
  flex-direction: row;
}

:deep(.vue-flow__controls .vue-flow__controls-button) {
  border: none;
  border-right: 1px solid #eee;
}

:deep(.vue-flow__controls .vue-flow__controls-button:last-child) {
  border-right: none;
}

:deep(.vue-flow__pane.selection) {
  cursor: default;
}

/* Force cursor styles when Space is held (panning mode) */
:deep(.panning-mode .vue-flow__pane) {
  cursor: grab;
}

:deep(.panning-mode .vue-flow__pane.dragging) {
  cursor: grabbing;
}

/* Place minimap above controls */
.vue-flow__minimap {
  bottom: 40px; /* Force override of .vue-flow__panel.bottom */
  transform: none; /* Reset potential defaults */
}
</style>
