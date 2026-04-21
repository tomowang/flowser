<script setup lang="ts">
import { computed, ref, inject } from "vue";
import { useI18n } from "vue-i18n";
import { Handle, Position, useVueFlow } from "@vue-flow/core";
import { Registry } from "@/lib/nodes/registry";
import { Trash2, AlertTriangle, Plus, Play } from "lucide-vue-next";
import { validateNode } from "@/lib/utils/validation";
import { IWorkflowNode } from "@/lib/types";
import NodeIcon from "./NodeIcon.vue";

const props = defineProps<{
  id: string; // Add ID prop to identify the node for removal
  data: Record<string, unknown>;
  selected?: boolean;
}>();

const { t, te } = useI18n();
const { removeNodes, getEdges, project, findNode } = useVueFlow();
const isHovered = ref(false);

const openQuickAdd = inject<(nodeId: string, handleId: string, handleType: "source" | "target", position: { x: number; y: number }, screenPosition: { x: number; y: number }) => void>("openQuickAdd");
const runSingleNode = inject<(nodeId: string) => Promise<void>>("runSingleNode");

const isHandleConnected = (handleId: string, type: "source" | "target") => {
  return getEdges.value.some((e) => {
    if (type === "source") {
      return e.source === props.id && e.sourceHandle === handleId;
    } else {
      return e.target === props.id && e.targetHandle === handleId;
    }
  });
};

const nodeType = computed(() => {
  return Registry.get(props.data.nodeType as string);
});

// Construct a temporary IWorkflowNode object for validation
// We only need type and data for validation
const validationResult = computed(() => {
  const nodeForValidation: IWorkflowNode = {
    id: props.id,
    type: props.data.nodeType as string,
    data: props.data,
    position: { x: 0, y: 0 }, // Dummy position
  };
  return validateNode(nodeForValidation);
});

const isValid = computed(() => validationResult.value.isValid);

const allInputs = computed(() => nodeType.value?.description.inputs || []);
const allOutputs = computed(() => nodeType.value?.description.outputs || []);

const mainInputs = computed(() =>
  allInputs.value.filter((p) => p.type === "main"),
);
const bottomInputs = computed(() => {
  const inputs = allInputs.value.filter((p) => p.type !== "main");
  const order = ["model", "memory", "tool"];
  return inputs.sort((a, b) => {
    const idxA = order.indexOf(a.type);
    const idxB = order.indexOf(b.type);
    // If both are in the order list, sort by index
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    // If only A is in list, A comes first
    if (idxA !== -1) return -1;
    // If only B is in list, B comes first
    if (idxB !== -1) return 1;
    // maintain original order for others
    return 0;
  });
});

const mainOutputs = computed(() =>
  allOutputs.value.filter((p) => p.type === "main"),
);
const topOutputs = computed(() =>
  allOutputs.value.filter((p) => p.type !== "main"),
);

const getHandleStyle = (type: string) => {
  if (type === "tool") {
    return { backgroundColor: "#ff9800" };
  }
  return {};
};

const deleteNode = (e: Event) => {
  e.stopPropagation(); // Prevent selecting the node when clicking delete
  removeNodes([props.id]);
};

const onPlusClick = (handleId: string, handleType: "source" | "target", event: MouseEvent) => {
  event.stopPropagation();
  if (openQuickAdd) {
    const node = findNode(props.id);
    let position = { x: 0, y: 0 };

    if (node) {
      if (handleType === "source") {
        // Source handle (output): Place new node to the right
        position = {
          x: node.position.x + (node.dimensions?.width || 200) + 60,
          y: node.position.y,
        };
      } else {
        // Target handle (input): Place new node below
        position = {
          x: node.position.x,
          y: node.position.y + (node.dimensions?.height || 100) + 80,
        };
      }
    } else {
      // Fallback to projected coordinates if node isn't found
      position = project({ x: event.clientX + 40, y: event.clientY - 40 });
    }

    // Pass screen coordinates for panel positioning
    openQuickAdd(props.id, handleId, handleType, position, {
      x: event.clientX,
      y: event.clientY,
    });
  }
};
</script>

<template>
  <div
    class="relative group min-w-[180px] rounded-lg border bg-card p-3 shadow-md hover:shadow-lg transition-all node-hover-area"
    :class="{
      '!ring-2 !ring-gray-400 !shadow-[0_0_10px_2px_rgba(156,163,175,0.5)]':
        selected,
      'status-running': data.executionStatus === 'running',
      '!border-green-500 ring-2 ring-green-500/20':
        data.executionStatus === 'success',
      '!border-red-500 ring-2 ring-red-500/20':
        data.executionStatus === 'error',
      'hover:border-primary/50': !data.executionStatus,
    }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Header -->
    <div class="flex items-center gap-3 mb-2">
      <!-- Icon placeholder (could be dynamic based on node type) -->
      <div
        class="flex h-8 w-8 items-center justify-center rounded bg-muted text-muted-foreground p-1.5"
      >
        <NodeIcon
          :icon="nodeType?.description.icon"
          :node-name="nodeType?.description.name"
          class="h-full w-full"
        />
      </div>

      <div class="flex flex-col overflow-hidden">
        <span class="text-sm font-semibold truncate">{{ data.label }}</span>
        <span class="text-[10px] text-muted-foreground truncate">{{
          nodeType?.description.name && te(`nodes.${nodeType.description.name}.displayName`)
            ? t(`nodes.${nodeType.description.name}.displayName`)
            : nodeType?.description.displayName
        }}</span>
      </div>
    </div>

    <!-- Main Inputs (Left) -->
    <Handle
      v-for="(port, index) in mainInputs"
      :id="port.name"
      :key="port.name"
      type="target"
      :position="Position.Left"
      class="transition-colors !w-3 !h-3 !cursor-crosshair"
      :style="{
        ...getHandleStyle(port.type),
        top: `${((index + 1) * 100) / (mainInputs.length + 1)}%`,
      }"
    />

    <!-- Main Outputs (Right) -->
    <div
      v-for="(port, index) in mainOutputs"
      :key="port.name"
      class="absolute !-right-1.5"
      :style="{
        top: `${((index + 1) * 100) / (mainOutputs.length + 1)}%`,
        transform: 'translateY(-50%)',
      }"
    >
      <Handle
        :id="port.name"
        type="source"
        :position="Position.Right"
        class="transition-colors !w-3 !h-3 !static !transform-none !cursor-crosshair"
        :style="getHandleStyle(port.type)"
      />
      <!-- Plus Button for unconnected main output -->
      <div
        v-if="!isHandleConnected(port.name, 'source')"
        class="absolute left-1/2 top-1/2 -translate-y-1/2 flex items-center group/plus z-20"
      >
        <div class="w-12 h-[2px] bg-muted-foreground/30 group-hover/plus:bg-primary/50 transition-colors"></div>
        
        <!-- NEW: Wrap in Handle for draggability -->
        <Handle
          :id="port.name"
          type="source"
          :position="Position.Right"
          class="!bg-transparent !border-none !w-4 !h-4 !-ml-2 !static !flex !items-center !justify-center !p-0 !cursor-grab hover:!cursor-grabbing translate-y-1/2"
        >
          <button
            class="w-4 h-4 rounded-full bg-card border border-muted-foreground/30 flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary group-hover/plus:bg-primary group-hover/plus:text-primary-foreground group-hover/plus:border-primary transition-all shadow-sm pointer-events-auto"
            @click="onPlusClick(port.name, 'source', $event)"
          >
            <Plus class="w-3 h-3" />
          </button>
        </Handle>
      </div>
    </div>

    <!-- Bottom Inputs (Tool/Model/Memory) -->
    <div
      v-if="bottomInputs.length"
      class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex gap-12 z-10"
    >
      <div
        v-for="port in bottomInputs"
        :key="port.name"
        class="relative group/handle"
      >
        <Handle
          :id="port.name"
          type="target"
          :position="Position.Bottom"
          class="!relative !transform-none !rotate-45 !rounded-none !left-0 !w-2 !h-2 !bg-white transition-colors border-2 !border-muted-foreground block !cursor-crosshair"
          :style="getHandleStyle(port.type)"
        />

        <!-- Plus Button for unconnected bottom input -->
        <div
          v-if="!isHandleConnected(port.name, 'target')"
          class="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center group/plus z-20 mt-0.5"
        >
          <div class="h-8 w-[2px] bg-muted-foreground/30 group-hover/plus:bg-primary/50 transition-colors"></div>

          <!-- NEW: Wrap in Handle for draggability -->
          <Handle
            :id="port.name"
            type="target"
            :position="Position.Bottom"
            class="!bg-transparent !border-none !w-4 !h-4 !-mt-2 !static !flex !items-center !justify-center !p-0 !cursor-grab hover:!cursor-grabbing translate-x-1/2"
          >
            <button
              class="w-4 h-4 rounded-full bg-card border border-muted-foreground/30 flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary group-hover/plus:bg-primary group-hover/plus:text-primary-foreground group-hover/plus:border-primary transition-all shadow-sm pointer-events-auto"
              @click="onPlusClick(port.name, 'target', $event)"
            >
              <Plus class="w-3 h-3" />
            </button>
          </Handle>
        </div>

        <span
          class="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] bg-popover px-1 rounded shadow whitespace-nowrap z-20 pointer-events-none"
          >{{ port.label || port.name }}</span
        >
      </div>
    </div>

    <!-- Top Outputs (Tool/Model Outputs) -->
    <div
      v-if="topOutputs.length"
      class="absolute -top-1.5 left-1/2 -translate-x-1/2 flex gap-2 z-10"
    >
      <div
        v-for="port in topOutputs"
        :key="port.name"
        class="relative group/handle"
      >
        <Handle
          :id="port.name"
          type="source"
          :position="Position.Top"
          class="!relative !transform-none !rotate-45 !rounded-none !left-0 !w-2 !h-2 !bg-white transition-colors border-2 !border-muted-foreground block !cursor-crosshair"
          :style="getHandleStyle(port.type)"
        />

        <span
          class="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] bg-popover px-1 rounded shadow opacity-0 group-hover/handle:opacity-100 whitespace-nowrap z-20 pointer-events-none"
          >{{ port.label || port.name }}</span
        >
      </div>
    </div>

    <!-- Actions (Top) -->
    <div
      class="absolute -top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1 rounded-full bg-card shadow-md opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto"
    >
      <button
        class="rounded-full bg-primary p-1.5 text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors flex items-center justify-center"
        :title="t('workflowEditor.runNode')"
        @click.stop="runSingleNode?.(id)"
      >
        <Play class="h-3 w-3" />
      </button>
      <div class="w-px h-3 bg-border mx-0.5"></div>
      <button
        class="rounded-full bg-muted p-1.5 text-muted-foreground shadow-sm hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center justify-center"
        :title="t('workflowEditor.deleteNode')"
        @click.stop="deleteNode"
      >
        <Trash2 class="h-3 w-3" />
      </button>
    </div>

    <!-- Validation Warning (Bottom Right) -->
    <div
      v-if="!isValid"
      class="absolute -bottom-2 -right-2 z-50 rounded-full bg-yellow-100 p-1 text-yellow-600 shadow-sm border border-yellow-200"
      :title="validationResult.errors.join('\n')"
    >
      <AlertTriangle class="h-3 w-3" />
    </div>
  </div>
</template>

<style scoped>
@keyframes border-flash {
  0%,
  100% {
    border-color: #f97316; /* orange-500 */
    box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
  }
  50% {
    border-color: #fb923c; /* orange-400 */
    box-shadow: 0 0 0 4px rgba(251, 146, 60, 0.4);
  }
}

.status-running {
  animation: border-flash 1.5s infinite ease-in-out;
  /* Override other borders */
  border-color: #f97316 !important;
}

.node-hover-area::before {
  content: "";
  position: absolute;
  top: -40px;
  left: 0;
  right: 0;
  height: 40px;
  background: transparent;
}
</style>
