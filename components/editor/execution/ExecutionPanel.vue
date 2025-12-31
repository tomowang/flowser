<script setup lang="ts">
import { IWorkflowExecutionResult, IExecutionNodeResult } from "@/lib/types";
import { ref, computed } from "vue";
import { X, ChevronDown, ChevronUp } from "lucide-vue-next";
import ExecutionNodeList from "./ExecutionNodeList.vue";
import ExecutionNodeDetail from "./ExecutionNodeDetail.vue";

const props = defineProps<{
  executionResult: IWorkflowExecutionResult;
  isCollapsed?: boolean;
}>();

const emit = defineEmits(["close", "toggle-collapse"]);

const selectedNodeId = ref<string | undefined>(undefined);

// Auto-select the first node or the failed node if any
// This logic could be improved to select the last executed node by default or similar
const initSelection = () => {
  if (props.executionResult.nodeExecutionResults.length > 0) {
    const errorNode = props.executionResult.nodeExecutionResults.find(
      (n) => n.status === "error",
    );
    selectedNodeId.value = errorNode
      ? errorNode.nodeId
      : props.executionResult.nodeExecutionResults[0].nodeId;
  }
};

// Initialize selection when component mounts or result changes
// Using a watcher might be better if the result prop changes
import { watch, onMounted } from "vue";

watch(
  () => props.executionResult,
  () => {
    initSelection();
  },
  { immediate: true },
);

const selectedResult = computed(() => {
  return (
    props.executionResult.nodeExecutionResults.find(
      (n) => n.nodeId === selectedNodeId.value,
    ) || null
  );
});

const onNodeSelect = (nodeId: string) => {
  selectedNodeId.value = nodeId;
};
</script>

<template>
  <div class="flex flex-col h-full w-full bg-background border-t shadow-xl">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 h-10 border-b bg-card shrink-0 cursor-pointer"
      @click="emit('toggle-collapse')"
    >
      <div class="flex items-center gap-2">
        <span class="font-semibold text-sm">Execution Results</span>
        <span
          class="text-xs px-2 py-0.5 rounded-full"
          :class="{
            'bg-green-100 text-green-700': executionResult.status === 'success',
            'bg-red-100 text-red-700': executionResult.status === 'error',
          }"
        >
          {{ executionResult.status }}
        </span>
        <span class="text-xs text-muted-foreground ml-2">
          {{ executionResult.nodeExecutionResults.length }} nodes executed in
          {{ executionResult.endTime - executionResult.startTime }}ms
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click.stop="emit('toggle-collapse')"
          class="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <ChevronUp v-if="isCollapsed" class="h-4 w-4" />
          <ChevronDown v-else class="h-4 w-4" />
        </button>
        <button
          @click.stop="emit('close')"
          class="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Body -->
    <div v-show="!isCollapsed" class="flex flex-1 overflow-hidden">
      <!-- Left Panel: Node List -->
      <div class="w-64 shrink-0">
        <ExecutionNodeList
          :results="executionResult.nodeExecutionResults"
          :selected-node-id="selectedNodeId"
          @select="onNodeSelect"
        />
      </div>

      <!-- Right Panel: Details -->
      <div class="flex-1 overflow-hidden">
        <ExecutionNodeDetail :node-result="selectedResult" />
      </div>
    </div>
  </div>
</template>
