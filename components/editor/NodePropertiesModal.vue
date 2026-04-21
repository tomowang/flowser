<script setup lang="ts">
import { computed, ref, watch, inject } from "vue";
import { useI18n } from "vue-i18n";
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
import { Input } from "@/components/ui/input";
import type { Node, Edge } from "@vue-flow/core";
import NodeInspector from "@/components/editor/NodeInspector.vue";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import type { IWorkflowExecutionResult } from "@/lib/types";
import { Registry } from "@/lib/nodes/registry";
import { Plus, Play } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import NodeIcon from "./NodeIcon.vue";

const props = defineProps<{
  node: Node;
  nodes: Node[];
  edges: Edge[];
  isOpen: boolean;
  executionResult: IWorkflowExecutionResult | null;
}>();

const emit = defineEmits(["close", "update:data"]);

const { t, te } = useI18n();

const runSingleNode = inject<(nodeId: string) => Promise<void>>("runSingleNode");

// Get node type and icon
const nodeType = computed(() => {
  if (!props.node) return null;
  return Registry.get(props.node.data.nodeType);
});

const nodeIcon = computed(() => {
  return nodeType.value?.description.icon || Plus;
});

// Name editing logic
const localName = ref("");
const nameError = ref("");

watch(
  () => props.node?.data?.label,
  (newLabel) => {
    if (newLabel && newLabel !== localName.value) {
      localName.value = newLabel;
    }
  },
  { immediate: true },
);

const updateName = (newName: string) => {
  localName.value = newName;

  if (!newName.trim()) {
    nameError.value = t("workflowEditor.nameEmpty");
    return;
  }

  // Check uniqueness against other nodes
  const exists = props.nodes.some(
    (n) => n.id !== props.node.id && (n.data?.label || n.id) === newName,
  );

  if (exists) {
    nameError.value = t("workflowEditor.nameExists");
    return;
  }

  nameError.value = "";
  if (props.node.data.label !== newName) {
    const newData = { ...props.node.data, label: newName };
    emit("update:data", newData);
  }
};

const validateNameOnBlur = () => {
  if (nameError.value) {
    localName.value = props.node.data.label;
    nameError.value = "";
  }
};

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
    let label = node.data.label;
    if (!label) {
      const nodeTypeName = node.data.nodeType;
      const key = `nodes.${nodeTypeName}.displayName`;
      label = te(key) ? t(key) : nodeTypeName;
    }
    return {
      id: node.id,
      label,
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
          <div class="flex flex-col gap-0.5">
            <Input
              :model-value="localName"
              class="h-7 font-semibold px-1 -ml-1 bg-transparent border-transparent shadow-none hover:border-input focus:border-input w-[300px]"
              :class="{ 'border-destructive hover:border-destructive focus:border-destructive text-destructive': nameError }"
              @input="(e: Event) => updateName((e.target as HTMLInputElement).value)"
              @blur="validateNameOnBlur"
            />
            <span v-if="nameError" class="text-[10px] text-destructive leading-none px-1">
              {{ nameError }}
            </span>
          </div>
        </DialogTitle>
        <DialogDescription class="hidden">
          {{ t("workflowEditor.nodeConfigDesc") }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 grid grid-cols-12 overflow-hidden">
        <!-- Input Data (Left) -->
        <div
          class="col-span-3 border-r flex flex-col bg-muted/10 h-full overflow-hidden"
        >
          <div class="p-3 border-b flex items-center justify-between bg-muted/30 min-h-[49px]">
            <span class="font-medium text-sm">{{ t("workflowEditor.inputData") }}</span>
            <Select v-if="dropdownOptions.length > 0" v-model="selectedUpstreamNodeId">
              <SelectTrigger class="h-8 w-[160px] text-xs">
                <SelectValue :placeholder="t('workflowEditor.selectNode')" />
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
              {{ t("workflowEditor.noInputData") }} <br />
              {{ t("workflowEditor.executeToSeeData") }}
            </div>
            <div v-else class="text-sm text-muted-foreground italic p-2">
              {{ t("workflowEditor.noOutputDataForNode") }}
            </div>
          </div>
        </div>

        <!-- Properties (Middle) -->
        <div class="col-span-6 flex flex-col h-full overflow-hidden">
          <div class="p-3 border-b font-medium text-sm bg-muted/30 min-h-[49px] flex items-center justify-between">
            <span>{{ t("workflowEditor.properties") }}</span>
            <Button
              v-if="node"
              size="sm"
              variant="outline"
              class="h-7 px-2"
              @click="runSingleNode?.(node.id)"
            >
              <Play class="h-3.5 w-3.5 mr-1" />
              {{ t("workflowEditor.runNode") }}
            </Button>
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
            {{ t("workflowEditor.outputData") }}
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
              {{ t("workflowEditor.noOutputData") }}
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
