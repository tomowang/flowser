<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { Registry } from "@/lib/nodes/registry";
import { INodePort } from "@/lib/types";

const props = defineProps<{
  data: any;
}>();

const nodeType = computed(() => {
  return Registry.get(props.data.nodeType);
});

const getPorts = (ports: (string | INodePort)[] | undefined) => {
  if (!ports) return [];
  return ports.map((p) => {
    if (typeof p === "string") {
      return { name: p, type: "main", label: p };
    }
    return p;
  });
};

const inputs = computed(() => getPorts(nodeType.value?.description.inputs));
const outputs = computed(() => getPorts(nodeType.value?.description.outputs));

const getHandleStyle = (type: string) => {
  if (type === "tool") {
    return { backgroundColor: "#ff9800" };
  }
  return {};
};
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
      <div v-for="port in inputs" :key="port.name" class="relative">
        <Handle
          type="target"
          :position="Position.Left"
          :id="port.name"
          class="!w-2 !h-2"
          :style="{ top: '50%', ...getHandleStyle(port.type) }"
        />
        <span class="ml-3 text-[10px]">{{ port.label || port.name }}</span>
      </div>
    </div>

    <!-- Outputs -->
    <div class="flex flex-col gap-1 mt-1">
      <div v-for="port in outputs" :key="port.name" class="relative text-right">
        <span class="mr-3 text-[10px]">{{ port.label || port.name }}</span>
        <Handle
          type="source"
          :position="Position.Right"
          :id="port.name"
          class="!w-2 !h-2"
          :style="{ top: '50%', ...getHandleStyle(port.type) }"
        />
      </div>
    </div>
  </div>
</template>
