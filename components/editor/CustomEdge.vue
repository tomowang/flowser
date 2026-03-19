<script setup lang="ts">
import { computed, ref } from "vue";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  useVueFlow,
  Position,
} from "@vue-flow/core";
import { Trash2 } from "lucide-vue-next";

const props = defineProps<EdgeProps>();

const { removeEdges } = useVueFlow();

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

const path = computed(() => getBezierPath(props));

const isMainConnection = computed(
  () =>
    props.sourcePosition === Position.Right &&
    props.targetPosition === Position.Left,
);

const edgeStyle = computed(() => {
  if (!isMainConnection.value) {
    return { ...props.style, strokeDasharray: "5, 6" };
  }
  return props.style;
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
