<script setup lang="ts">
import { computed, type Component } from "vue";
import { Key } from "lucide-vue-next";
import { getCredentialIconContent } from "@/lib/credentials/icons";

interface Props {
  icon?: string | Component;
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

const svgDataUrl = computed(() => {
  if (svgContent.value) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent.value)}`;
  }
  return undefined;
});

const isLucideIcon = computed(() => {
  return typeof props.icon === "object" || typeof props.icon === "function";
});
</script>

<template>
  <div class="flex items-center justify-center overflow-hidden">
    <img
      v-if="svgDataUrl"
      :src="svgDataUrl"
      class="h-full w-full object-contain"
      aria-hidden="true"
    />
    <component :is="icon" v-else-if="isLucideIcon" v-bind="$attrs" />
    <Key v-else v-bind="$attrs" />
  </div>
</template>
