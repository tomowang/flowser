<script setup lang="ts">
import { computed, ref } from "vue";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  type EdgeProps,
  useVueFlow,
  Position,
} from "@vue-flow/core";
import { Trash2 } from "@lucide/vue";
import { getNodeCategory } from "@/lib/nodes/nodeCategory";

const props = defineProps<EdgeProps>();

const { removeEdges, findNode } = useVueFlow();

const sourceNodeType = computed(() => {
  const sourceNode = props.sourceNode || findNode(props.source);
  return sourceNode?.data?.nodeType as string | undefined;
});

const sourceCategory = computed(() => getNodeCategory(sourceNodeType.value));
const sourceCategoryVar = computed(() => `var(--node-${sourceCategory.value})`);

const label = computed(() => {
  if (sourceNodeType.value === "if") {
    if (props.sourceHandleId === "true") return "True";
    if (props.sourceHandleId === "false") return "False";
  }
  return null;
});

const isHovered = ref(false);
let hoverTimeout: ReturnType<typeof setTimeout> | null = null;

const setHover = (value: boolean) => {
  if (hoverTimeout) clearTimeout(hoverTimeout);
  if (value) {
    isHovered.value = true;
  } else {
    // Small delay to allow moving mouse from edge to button
    hoverTimeout = setTimeout(() => {
      isHovered.value = false;
    }, 100);
  }
};

const isMainConnection = computed(
  () =>
    props.sourcePosition === Position.Right &&
    props.targetPosition === Position.Left,
);

const path = computed(() => {
  if (isMainConnection.value && props.targetX < props.sourceX) {
    return getSmoothStepPath(props);
  }
  return getBezierPath(props);
});

const edgeStyle = computed(() => {
  const style = { ...props.style, stroke: sourceCategoryVar.value, strokeWidth: 2 };
  if (!isMainConnection.value) {
    return { ...style, strokeDasharray: "5, 6" };
  }
  return style;
});

const onEdgeClick = (e: MouseEvent) => {
  e.stopPropagation();
  removeEdges([props.id]);
};
</script>

<template>
  <g @mouseenter="setHover(true)" @mouseleave="setHover(false)">
    <!-- Transparent wider stroke for easier selection/hover -->
    <path
      :d="path[0]"
      class="vue-flow__edge-path-selector"
      fill="none"
      stroke="transparent"
      stroke-width="20"
      style="pointer-events: stroke; cursor: pointer"
    />

    <!-- The actual visible edge path -->
    <BaseEdge :path="path[0]" :style="edgeStyle" :marker-end="markerEnd" />

    <!-- Branch Label -->
    <EdgeLabelRenderer v-if="label">
      <div
        :style="{
          transform: `translate(-50%, -50%) translate(${sourceX + 24}px, ${sourceY}px)`,
          background: `color-mix(in oklch, ${sourceCategoryVar} 15%, transparent)`,
          borderColor: `color-mix(in oklch, ${sourceCategoryVar} 30%, transparent)`,
          color: sourceCategoryVar,
        }"
        class="nodrag nopan absolute text-[9px] font-mono font-semibold uppercase tracking-wider border rounded-sm px-1.5 py-0.5 z-10 pointer-events-none"
      >
        {{ label }}
      </div>
    </EdgeLabelRenderer>

    <!-- Delete Button -->
    <EdgeLabelRenderer>
      <div
        v-if="isHovered"
        :style="{
          transform: `translate(-50%, -50%) translate(${path[1]}px,${path[2]}px)`,
          pointerEvents: 'all',
        }"
        class="nodrag nopan absolute z-50"
        @mouseenter="setHover(true)"
        @mouseleave="setHover(false)"
      >
        <button
          class="rounded-full bg-red-500 p-1.5 text-white shadow-md hover:bg-red-600 transition-colors"
          @click.stop="onEdgeClick"
        >
          <Trash2 class="h-3 w-3" />
        </button>
      </div>
    </EdgeLabelRenderer>
  </g>
</template>

<style scoped>
.vue-flow__edge-path-selector:hover + .vue-flow__edge-path,
.vue-flow__edge-path:hover {
  stroke: #555;
}
</style>
