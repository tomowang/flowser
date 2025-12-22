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
const bottomInputs = computed(() =>
  allInputs.value.filter((p) => p.type !== "main"),
);

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
    class="relative group min-w-[180px] rounded-lg border bg-card p-3 shadow-md hover:shadow-lg transition-all hover:border-primary/50"
    :class="{ 'ring-2 ring-primary ring-offset-2': data.selected }"
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
      :key="port.name"
      type="target"
      :position="Position.Left"
      :id="port.name"
      class="transition-colors !w-3 !h-3"
      :style="{
        ...getHandleStyle(port.type),
      }"
    />

    <!-- Main Outputs (Right) -->
    <Handle
      v-for="port in mainOutputs"
      :key="port.name"
      type="source"
      :position="Position.Right"
      :id="port.name"
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
          type="target"
          :position="Position.Bottom"
          :id="port.name"
          class="!relative !transform-none !w-3 !h-3 !bg-muted-foreground hover:!bg-primary transition-colors border-2 border-background block"
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
          type="source"
          :position="Position.Top"
          :id="port.name"
          class="!relative !transform-none !w-3 !h-3 !bg-muted-foreground hover:!bg-primary transition-colors border-2 border-background block"
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
      @click="deleteNode"
      class="absolute -top-3 -right-3 z-50 rounded-full bg-red-500 p-1.5 text-white shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
      title="Delete Node"
    >
      <Trash2 class="h-3 w-3" />
    </button>
  </div>
</template>
