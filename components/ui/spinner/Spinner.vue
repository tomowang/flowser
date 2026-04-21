<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { useI18n } from "vue-i18n"
import { Loader2Icon } from "lucide-vue-next"
import { cn } from "@/lib/utils"

const { t } = useI18n()
const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <Loader2Icon
    role="status"
    :aria-label="t('common.loading')"
    :class="cn('size-4 animate-spin', props.class)"
  />
</template>
