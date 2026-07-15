<script setup lang="ts">
import { ref, watch, type Component } from "vue";
import { useI18n } from "vue-i18n";
import type { IDataObject } from "@/lib/types";
import { ChevronRight } from "@lucide/vue";
import NodeIcon from "./NodeIcon.vue";
import SchemaTreeItem from "./SchemaTreeItem.vue";

const props = defineProps<{
  entries: {
    id: string;
    label: string;
    icon?: string | Component;
    nodeTypeName: string;
    sample: IDataObject | null;
  }[];
}>();

const { t } = useI18n();

const expandedIds = ref<Set<string>>(new Set());

// Expand the most recently executed node by default
watch(
  () => props.entries,
  (entries) => {
    if (entries.length > 0 && expandedIds.value.size === 0) {
      expandedIds.value = new Set([entries[0].id]);
    }
  },
  { immediate: true },
);

const toggle = (id: string) => {
  const next = new Set(expandedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  expandedIds.value = next;
};
</script>

<template>
  <div class="flex flex-col gap-1">
    <div v-for="entry in entries" :key="entry.id">
      <div
        class="flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-accent/50 transition-colors"
        @click="toggle(entry.id)"
      >
        <ChevronRight
          class="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform"
          :class="{ 'rotate-90': expandedIds.has(entry.id) }"
        />
        <div
          class="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted p-0.5"
        >
          <NodeIcon
            :icon="entry.icon"
            :node-name="entry.nodeTypeName"
            class="h-full w-full"
          />
        </div>
        <span class="text-xs font-medium truncate">{{ entry.label }}</span>
      </div>
      <div v-if="expandedIds.has(entry.id)" class="pl-4 pb-1">
        <template v-if="entry.sample && Object.keys(entry.sample).length > 0">
          <SchemaTreeItem
            v-for="(val, key) in entry.sample"
            :key="key"
            :name="String(key)"
            :value="val"
            :depth="0"
          />
        </template>
        <div v-else class="text-xs text-muted-foreground italic px-1 py-1">
          {{ t("workflowEditor.emptyNodeOutput") }}
        </div>
      </div>
    </div>
  </div>
</template>
