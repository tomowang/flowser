<script setup lang="ts">
import { computed } from "vue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Node } from "@vue-flow/core";
import NodeInspector from "@/components/editor/NodeInspector.vue";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import type { IWorkflowExecutionResult } from "@/lib/types";
import { Registry } from "@/lib/nodes/registry";
import { Plus } from "lucide-vue-next";
import NodeIcon from "./NodeIcon.vue";

const props = defineProps<{
  node: Node;
  isOpen: boolean;
  executionResult: IWorkflowExecutionResult | null;
}>();

const emit = defineEmits(["close", "update:data"]);

// Get node type and icon
const nodeType = computed(() => {
  if (!props.node) return null;
  return Registry.get(props.node.data.nodeType);
});

const nodeIcon = computed(() => {
  return nodeType.value?.description.icon || Plus;
});

// Find execution data for this node
const nodeExecutionData = computed(() => {
  if (!props.executionResult || !props.node) return null;
  const nodeResult = props.executionResult.nodeExecutionResults.find(
    (n) => n.nodeId === props.node.id || n.nodeName === props.node.data.label,
  );
  return nodeResult;
});

const inputData = computed(() => {
  if (!nodeExecutionData.value) return null;
  // Flattens the input data for display, or show as array
  return nodeExecutionData.value.inputData.map((d) => d.json);
});

const outputData = computed(() => {
  if (!nodeExecutionData.value) return null;
  return nodeExecutionData.value.outputData.map((d) => d.json);
});
</script>

<template>
  <Dialog :open="isOpen" @update:open="(val) => !val && emit('close')">
    <DialogContent
      class="w-[calc(100vw-3rem)] h-[calc(100vh-3rem)] sm:max-w-none flex flex-col p-0 gap-0"
    >
      <DialogHeader class="p-4 border-b">
        <DialogTitle class="flex items-center gap-2">
          <div
            class="flex h-6 w-6 items-center justify-center rounded bg-muted p-1"
          >
            <NodeIcon
              :icon="nodeIcon"
              :node-name="node?.data?.nodeType"
              class="h-full w-full"
            />
          </div>
          {{ node?.data?.label || "Node Properties" }}
        </DialogTitle>
        <DialogDescription class="hidden"
          >Node configuration and execution data</DialogDescription
        >
      </DialogHeader>

      <div class="flex-1 grid grid-cols-12 overflow-hidden">
        <!-- Input Data (Left) -->
        <div
          class="col-span-3 border-r flex flex-col bg-muted/10 h-full overflow-hidden"
        >
          <div class="p-3 border-b font-medium text-sm bg-muted/30">
            Input Data
          </div>
          <div class="flex-1 overflow-auto p-3">
            <div v-if="inputData && inputData.length > 0">
              <vue-json-pretty
                :data="inputData"
                :deep="3"
                :show-length="true"
              />
            </div>
            <div v-else class="text-sm text-muted-foreground italic p-2">
              No input data available. <br />Execute workflow to see data.
            </div>
          </div>
        </div>

        <!-- Properties (Middle) -->
        <div class="col-span-6 flex flex-col h-full overflow-hidden">
          <div class="p-3 border-b font-medium text-sm bg-muted/30">
            Configuration
          </div>
          <div class="flex-1 overflow-auto p-4">
            <NodeInspector
              v-if="node"
              :node="node"
              @update:data="(newData) => emit('update:data', newData)"
            />
          </div>
        </div>

        <!-- Output Data (Right) -->
        <div
          class="col-span-3 border-l flex flex-col bg-muted/10 h-full overflow-hidden"
        >
          <div class="p-3 border-b font-medium text-sm bg-muted/30">
            Output Data
          </div>
          <div class="flex-1 overflow-auto p-3">
            <div v-if="outputData && outputData.length > 0">
              <vue-json-pretty
                :data="outputData"
                :deep="3"
                :show-length="true"
              />
            </div>
            <div v-else class="text-sm text-muted-foreground italic p-2">
              No output data available.
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
