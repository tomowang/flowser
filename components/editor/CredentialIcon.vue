<script setup lang="ts">
import { computed } from "vue";
import { Key } from "lucide-vue-next";
import { getCredentialIconContent } from "@/lib/credentials/icons";

interface Props {
  icon?: string | object;
}

const props = defineProps<Props>();

const isSvgFile = computed(() => {
  return typeof props.icon === "string" && props.icon.startsWith("file:");
});

const svgContent = computed(() => {
  if (isSvgFile.value && typeof props.icon === "string") {
    const rawSvg = getCredentialIconContent(props.icon);
    if (rawSvg) {
      return rawSvg.replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"');
    }
  }
  return undefined;
});

const isLucideIcon = computed(() => {
  return typeof props.icon === "object" || typeof props.icon === "function";
});
</script>

<template>
  <div class="flex items-center justify-center overflow-hidden">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div
      v-if="svgContent"
      class="h-full w-full flex items-center justify-center [&>svg]:h-full [&>svg]:w-full"
      v-html="svgContent"
    />
    <component :is="icon" v-else-if="isLucideIcon" v-bind="$attrs" />
    <Key v-else v-bind="$attrs" />
  </div>
</template>
