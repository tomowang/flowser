<script setup lang="ts">
import { IExecutionNodeResult } from "@/lib/types";
import { useI18n } from "vue-i18n";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";

defineProps<{
  nodeResult: IExecutionNodeResult | null;
}>();

const { t } = useI18n();
</script>

<template>
  <div v-if="nodeResult" class="flex h-full bg-background">
    <!-- Input Column -->
    <div class="flex-1 flex flex-col border-r h-full overflow-hidden">
      <div
        class="flex items-center justify-between px-4 h-10 bg-muted/20 border-b shrink-0"
      >
        <span class="text-xs font-semibold uppercase text-muted-foreground">
          {{ t("executions.input") }}
        </span>
        <span
          class="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50"
        >
          {{ t("common.items", { count: nodeResult.inputData.length }) }}
        </span>
      </div>
      <div class="flex-1 overflow-auto p-4 custom-scrollbar">
        <template v-if="nodeResult.inputData.length > 0">
          <div
            v-for="(item, index) in nodeResult.inputData"
            :key="index"
            class="mb-4 last:mb-0 border rounded-md bg-card shadow-sm"
          >
            <div
              class="px-3 py-1.5 border-b bg-muted/10 text-[10px] font-mono text-muted-foreground"
            >
              {{ t("executions.itemIndex", { index: index + 1 }) }}
            </div>
            <div class="p-2 text-xs">
              <VueJsonPretty
                :data="item.json"
                :deep="3"
                :show-length="true"
                :show-line="true"
                :show-double-quotes="false"
              />
            </div>
          </div>
        </template>
        <div
          v-else
          class="h-full flex items-center justify-center text-xs text-muted-foreground italic"
        >
          {{ t("executions.noInputData") }}
        </div>
      </div>
    </div>

    <!-- Output Column -->
    <div class="flex-1 flex flex-col h-full overflow-hidden">
      <div
        class="flex items-center justify-between px-4 h-10 bg-muted/20 border-b shrink-0"
      >
        <span class="text-xs font-semibold uppercase text-muted-foreground">
          {{ t("executions.output") }}
        </span>
        <span
          class="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50"
        >
          {{ t("common.items", { count: nodeResult.outputData.length }) }}
        </span>
      </div>
      <div class="flex-1 overflow-auto p-4 custom-scrollbar">
        <template v-if="nodeResult.outputData.length > 0">
          <div
            v-for="(item, index) in nodeResult.outputData"
            :key="index"
            class="mb-4 last:mb-0 border rounded-md bg-card shadow-sm"
          >
            <div
              class="px-3 py-1.5 border-b bg-muted/10 text-[10px] font-mono text-muted-foreground"
            >
              {{ t("executions.itemIndex", { index: index + 1 }) }}
            </div>
            <div class="p-2 text-xs">
              <VueJsonPretty
                :data="item.json"
                :deep="3"
                :show-length="true"
                :show-line="true"
                :show-double-quotes="false"
              />
            </div>
          </div>
        </template>
        <div
          v-else
          class="h-full flex items-center justify-center text-xs text-muted-foreground italic"
        >
          {{ t("executions.noOutputData") }}
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    class="flex h-full items-center justify-center text-muted-foreground text-xs"
  >
    {{ t("executions.selectNodeToViewDetails") }}
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 0.2);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--muted-foreground) / 0.4);
}

/* Customize VueJsonPretty styles if needed */
:deep(.vjs-tree) {
  font-family: var(--font-mono);
  font-size: 12px;
}
</style>
