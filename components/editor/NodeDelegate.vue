<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { Registry } from "@/lib/nodes/registry";

const props = defineProps<{
  data: any;
}>();

const nodeType = computed(() => {
  return Registry.get(props.data.nodeType);
});

// We can look up inputs/outputs from definitions
const inputs = computed(() => nodeType.value?.description.inputs || []);
const outputs = computed(() => nodeType.value?.description.outputs || []);
</script>

<template>
  <div
    class="min-w-[150px] rounded-md border bg-card p-2 text-card-foreground shadow-sm"
  >
    <div class="flex items-center gap-2 border-b pb-1 mb-2">
      <!-- Icon placeholder -->
      <span class="text-xs font-bold">{{ data.label }}</span>
    </div>

    <!-- Inputs -->
    <div class="flex flex-col gap-1">
      <div v-for="(input, index) in inputs" :key="input" class="relative">
        <Handle
          type="target"
          :position="Position.Left"
          :id="input"
          class="!w-2 !h-2"
          :style="{ top: '50%' }"
        />
        <span class="ml-3 text-[10px]">{{ input }}</span>
      </div>
    </div>

    <!-- Outputs -->
    <div class="flex flex-col gap-1 mt-1">
      <div
        v-for="(output, index) in outputs"
        :key="output"
        class="relative text-right"
      >
        <span class="mr-3 text-[10px]">{{ output }}</span>
        <Handle
          type="source"
          :position="Position.Right"
          :id="output"
          class="!w-2 !h-2"
          :style="{ top: '50%' }"
        />
      </div>
    </div>
  </div>
</template>
