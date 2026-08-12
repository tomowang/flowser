<script setup lang="ts">
import { computed, ref } from "vue";
import type { IDataValue } from "@/lib/types";
import {
  ChevronRight,
  Type,
  Hash,
  ToggleLeft,
  List,
  Braces,
  CircleSlash,
} from "@lucide/vue";

const props = defineProps<{
  name: string;
  value: IDataValue;
  depth: number;
}>();

const isOpen = ref(true);

const valueType = computed(() => {
  const v = props.value;
  if (v === null || v === undefined) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
});

const typeIcon = computed(() => {
  switch (valueType.value) {
    case "string":
      return Type;
    case "number":
      return Hash;
    case "boolean":
      return ToggleLeft;
    case "array":
      return List;
    case "object":
      return Braces;
    default:
      return CircleSlash;
  }
});

// Schema children: object keys, or the first array item's schema (like n8n)
const children = computed<[string, IDataValue][]>(() => {
  const v = props.value;
  if (Array.isArray(v)) {
    const first = v[0];
    if (first === undefined) return [];
    if (first !== null && typeof first === "object" && !Array.isArray(first)) {
      return Object.entries(first);
    }
    return [["0", first]];
  }
  if (v !== null && typeof v === "object") {
    return Object.entries(v);
  }
  return [];
});

const hasChildren = computed(() => children.value.length > 0);

const preview = computed(() => {
  switch (valueType.value) {
    case "string":
      return props.value as string;
    case "number":
    case "boolean":
      return String(props.value);
    case "null":
      return props.value === undefined ? "undefined" : "null";
    default:
      return null;
  }
});
</script>

<template>
  <div>
    <div
      class="flex items-center gap-1.5 py-1 pr-1 text-xs rounded hover:bg-accent/40"
      :class="{ 'cursor-pointer': hasChildren }"
      :style="{ paddingLeft: `${depth * 14 + 4}px` }"
      @click="hasChildren && (isOpen = !isOpen)"
    >
      <ChevronRight
        v-if="hasChildren"
        class="h-3 w-3 shrink-0 text-muted-foreground transition-transform"
        :class="{ 'rotate-90': isOpen }"
      />
      <span v-else class="w-3 shrink-0" />
      <component
        :is="typeIcon"
        class="h-3.5 w-3.5 shrink-0 text-muted-foreground"
      />
      <span class="shrink-0 font-mono font-medium">{{ name }}</span>
      <span v-if="preview !== null" class="truncate text-muted-foreground">
        {{ preview }}
      </span>
    </div>
    <div v-if="hasChildren && isOpen">
      <SchemaTreeItem
        v-for="[key, val] in children"
        :key="key"
        :name="key"
        :value="val"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>
