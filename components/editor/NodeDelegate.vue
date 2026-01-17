<script setup lang="ts">
import { computed, ref } from "vue";
import { Handle, Position, useVueFlow } from "@vue-flow/core";
import { Registry } from "@/lib/nodes/registry";
import { Trash2 } from "lucide-vue-next";

const props = defineProps<{
  id: string; // Add ID prop to identify the node for removal
  data: any;
}>();

const { removeNodes } = useVueFlow();
const isHovered = ref(false);

const nodeType = computed(() => {
  return Registry.get(props.data.nodeType);
});

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
</script>

<template>
  <div
    class="relative group min-w-[180px] rounded-lg border bg-card p-3 shadow-md hover:shadow-lg transition-all"
    :class="{
      'ring-2 ring-primary ring-offset-2':
        data.selected && !data.executionStatus,
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
        class="flex h-8 w-8 items-center justify-center rounded bg-muted text-muted-foreground"
      >
        <component :is="nodeType?.description.icon || 'div'" class="h-5 w-5" />
      </div>

      <div class="flex flex-col overflow-hidden">
        <span class="text-sm font-semibold truncate">{{ data.label }}</span>
        <span class="text-[10px] text-muted-foreground truncate">{{
          nodeType?.description.displayName
        }}</span>
      </div>
    </div>

    <!-- Main Inputs (Left) -->
    <Handle
      v-for="port in mainInputs"
      :id="port.name"
      :key="port.name"
      type="target"
      :position="Position.Left"
      class="transition-colors !w-3 !h-3"
      :style="{
        ...getHandleStyle(port.type),
      }"
    />

    <!-- Main Outputs (Right) -->
    <Handle
      v-for="port in mainOutputs"
      :id="port.name"
      :key="port.name"
      type="source"
      :position="Position.Right"
      class="transition-colors !w-3 !h-3"
      :style="{
        ...getHandleStyle(port.type),
      }"
    />

    <!-- Bottom Inputs (Tool/Model/Memory) -->
    <div
      v-if="bottomInputs.length"
      class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex gap-2 z-10"
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
          class="!relative !transform-none !rotate-45 !rounded-none !left-0 !w-2 !h-2 !bg-white transition-colors border-2 !border-muted-foreground block"
          :style="getHandleStyle(port.type)"
        />
        <span
          class="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] bg-popover px-1 rounded shadow opacity-0 group-hover/handle:opacity-100 whitespace-nowrap z-20 pointer-events-none"
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
          class="!relative !transform-none !rotate-45 !rounded-none !left-0 !w-2 !h-2 !bg-white transition-colors border-2 !border-muted-foreground block"
          :style="getHandleStyle(port.type)"
        />
        <span
          class="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] bg-popover px-1 rounded shadow opacity-0 group-hover/handle:opacity-100 whitespace-nowrap z-20 pointer-events-none"
          >{{ port.label || port.name }}</span
        >
      </div>
    </div>

    <!-- Delete Button (Top Right) -->
    <button
      v-if="isHovered"
      class="absolute -top-3 -right-3 z-50 rounded-full bg-red-500 p-1.5 text-white shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
      title="Delete Node"
      @click="deleteNode"
    >
      <Trash2 class="h-3 w-3" />
    </button>
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
</style>
