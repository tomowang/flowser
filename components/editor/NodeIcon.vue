<script setup lang="ts">
import { computed } from "vue";
import { Plus } from "lucide-vue-next";
import { getNodeIconContent } from "@/lib/nodes/icons";

interface Props {
  icon?: string | object;
  nodeName: string;
}

const props = defineProps<Props>();

const isSvgFile = computed(() => {
  return typeof props.icon === "string" && props.icon.startsWith("file:");
});

const svgContent = computed(() => {
  if (isSvgFile.value && typeof props.icon === "string") {
    const rawSvg = getNodeIconContent(props.nodeName, props.icon);
    if (rawSvg) {
      // Ensure the SVG has preserveAspectRatio and no fixed dimensions that might break scaling
      return rawSvg
        .replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"');
    }
  }
  return undefined;
});

const isLucideIcon = computed(() => {
  return typeof props.icon === "object" || (typeof props.icon === "function");
});
</script>

<template>
  <div class="flex items-center justify-center h-full w-full overflow-hidden">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-if="svgContent" class="h-full w-full flex items-center justify-center [&>svg]:h-full [&>svg]:w-full" v-html="svgContent" />
    <component
      :is="icon"
      v-else-if="isLucideIcon"
      v-bind="$attrs"
    />
    <Plus v-else v-bind="$attrs" />
  </div>
</template>
