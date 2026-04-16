<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Node, Edge } from "@vue-flow/core";
import NodeInspector from "@/components/editor/NodeInspector.vue";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import type { IWorkflowExecutionResult } from "@/lib/types";
import { Registry } from "@/lib/nodes/registry";
import { Plus } from "lucide-vue-next";
import NodeIcon from "./NodeIcon.vue";

const props = defineProps<{
  node: Node;
  nodes: Node[];
  edges: Edge[];
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

// Find all upstream nodes
const upstreamNodes = computed(() => {
  if (!props.node || !props.edges || !props.nodes) return [];
  
  const visited = new Set<string>();
  const queue: string[] = [props.node.id];
  const upstream: Node[] = [];
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    
    // Find edges where target is currentId
    const incomingEdges = props.edges.filter(e => e.target === currentId);
    
    for (const edge of incomingEdges) {
      if (!visited.has(edge.source)) {
        visited.add(edge.source);
        const sourceNode = props.nodes.find(n => n.id === edge.source);
        if (sourceNode) {
          upstream.push(sourceNode);
          queue.push(sourceNode.id);
        }
      }
    }
  }
  
  return upstream;
});

// Find immediate predecessors for default selection
const immediatePredecessorIds = computed(() => {
  if (!props.node || !props.edges) return [];
  return props.edges
    .filter(e => e.target === props.node.id)
    .map(e => e.source);
});

// Calculate default upstream node (most recently executed immediate predecessor)
const defaultUpstreamNodeId = computed(() => {
  if (immediatePredecessorIds.value.length === 0) return null;
  
  if (!props.executionResult) return immediatePredecessorIds.value[0];
  
  const predecessorsWithResults = props.executionResult.nodeExecutionResults
    .filter(r => immediatePredecessorIds.value.includes(r.nodeId))
    .sort((a, b) => b.endTime - a.endTime);
    
  if (predecessorsWithResults.length > 0) {
    return predecessorsWithResults[0].nodeId;
  }
  
  return immediatePredecessorIds.value[0];
});

const selectedUpstreamNodeId = ref<string | null>(null);

// Initialize selected node
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    selectedUpstreamNodeId.value = defaultUpstreamNodeId.value;
  }
}, { immediate: true });

// Also update if execution result changes while open
watch(defaultUpstreamNodeId, (newVal) => {
  if (props.isOpen && !selectedUpstreamNodeId.value && newVal) {
    selectedUpstreamNodeId.value = newVal;
  }
});

// Dropdown options sorted by execution time if available
const dropdownOptions = computed(() => {
  const options = upstreamNodes.value.map(node => {
    const result = props.executionResult?.nodeExecutionResults.find(r => r.nodeId === node.id);
    return {
      id: node.id,
      label: node.data.label || node.data.nodeType,
      endTime: result?.endTime || 0
    };
  });
  
  return options.sort((a, b) => b.endTime - a.endTime);
});

// Display data for selected upstream node
const displayData = computed(() => {
  if (!props.executionResult || !selectedUpstreamNodeId.value) return null;
  
  const nodeResult = props.executionResult.nodeExecutionResults.find(
    (n) => n.nodeId === selectedUpstreamNodeId.value
  );
  
  if (!nodeResult) return null;
  return nodeResult.outputData.map((d) => d.json);
});

const nodeExecutionData = computed(() => {
  if (!props.executionResult || !props.node) return null;
  const nodeResult = props.executionResult.nodeExecutionResults.find(
    (n) => n.nodeId === props.node.id || n.nodeName === props.node.data.label,
  );
  return nodeResult;
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
          <div class="p-3 border-b flex items-center justify-between bg-muted/30 min-h-[49px]">
            <span class="font-medium text-sm">Input Data</span>
            <Select v-if="dropdownOptions.length > 0" v-model="selectedUpstreamNodeId">
              <SelectTrigger class="h-8 w-[160px] text-xs">
                <SelectValue placeholder="Select node" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  v-for="opt in dropdownOptions" 
                  :key="opt.id" 
                  :value="opt.id"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex-1 overflow-auto p-3">
            <div v-if="displayData && displayData.length > 0">
              <vue-json-pretty
                :data="displayData"
                :deep="3"
                :show-length="true"
              />
            </div>
            <div v-else-if="!executionResult" class="text-sm text-muted-foreground italic p-2">
              No input data available. <br />Execute workflow to see data.
            </div>
            <div v-else class="text-sm text-muted-foreground italic p-2">
              No output data available for the selected node.
            </div>
          </div>
        </div>

        <!-- Properties (Middle) -->
        <div class="col-span-6 flex flex-col h-full overflow-hidden">
          <div class="p-3 border-b font-medium text-sm bg-muted/30 min-h-[49px] flex items-center">
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
          <div class="p-3 border-b font-medium text-sm bg-muted/30 min-h-[49px] flex items-center">
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
