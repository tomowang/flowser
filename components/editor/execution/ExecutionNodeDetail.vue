<script setup lang="ts">
import { IExecutionNodeResult } from "@/lib/types";
import { ref, computed } from "vue";

const props = defineProps<{
  nodeResult: IExecutionNodeResult | null;
}>();

const activeTab = ref<"input" | "output">("output");

const displayData = computed(() => {
  if (!props.nodeResult) return [];
  if (activeTab.value === "input") {
    return props.nodeResult.inputData;
  }
  return props.nodeResult.outputData;
});

const formatJson = (data: any) => {
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return String(data);
  }
};
</script>

<template>
  <div class="flex flex-col h-full bg-background" v-if="nodeResult">
    <!-- Header / Tabs -->
    <div class="flex items-center border-b px-4 h-10 bg-muted/20">
      <button
        class="text-xs font-medium px-3 py-1 mr-2 rounded-md transition-colors"
        :class="
          activeTab === 'input'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="activeTab = 'input'"
      >
        Input
        <span class="ml-1 text-[10px] opacity-70">{{
          nodeResult.inputData.length
        }}</span>
      </button>
      <button
        class="text-xs font-medium px-3 py-1 rounded-md transition-colors"
        :class="
          activeTab === 'output'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="activeTab = 'output'"
      >
        Output
        <span class="ml-1 text-[10px] opacity-70">{{
          nodeResult.outputData.length
        }}</span>
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div
        v-if="displayData.length === 0"
        class="text-xs text-muted-foreground"
      >
        No data available using configured settings.
      </div>

      <div
        v-for="(item, index) in displayData"
        :key="index"
        class="border rounded-md bg-card"
      >
        <div
          class="bg-muted/30 px-3 py-1 border-b text-[10px] font-mono text-muted-foreground flex justify-between"
        >
          <span>Item {{ index + 1 }}</span>
        </div>
        <div class="p-2 overflow-x-auto">
          <pre class="text-xs font-mono text-foreground">{{
            formatJson(item.json)
          }}</pre>
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    class="flex h-full items-center justify-center text-muted-foreground text-xs"
  >
    Select a node to view details
  </div>
</template>
