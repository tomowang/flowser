<script setup lang="ts">
import { IExecutionNodeResult } from "@/lib/types";
import { Check, X, Clock, Loader2 } from "lucide-vue-next";
import { computed } from "vue";

const props = defineProps<{
  results: IExecutionNodeResult[];
  selectedExecutionId?: string;
}>();

const emit = defineEmits(["select"]);

const sortedResults = computed(() => {
  return [...props.results].sort((a, b) => a.startTime - b.startTime);
});

const formatDuration = (start: number, end: number) => {
  if (end === 0) return "-";
  const diff = end - start;
  return `${diff}ms`;
};
</script>

<template>
  <div class="flex flex-col h-full overflow-y-auto border-r bg-muted/20">
    <div
      v-for="result in sortedResults"
      :key="result.id"
      class="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors border-b last:border-0"
      :class="{
        'bg-accent text-accent-foreground': selectedExecutionId === result.id,
      }"
      @click="emit('select', result.id)"
    >
      <div
        class="flex h-6 w-6 items-center justify-center rounded-full"
        :class="{
          'bg-green-100 text-green-700': result.status === 'success',
          'bg-red-100 text-red-700': result.status === 'error',
          'bg-blue-100 text-blue-700': result.status === 'running',
        }"
      >
        <Check v-if="result.status === 'success'" class="h-3 w-3" />
        <X v-else-if="result.status === 'error'" class="h-3 w-3" />
        <Loader2
          v-else-if="result.status === 'running'"
          class="h-3 w-3 animate-spin"
        />
      </div>

      <div class="flex flex-col min-w-0 flex-1">
        <span class="text-xs font-medium truncate">{{ result.nodeName }}</span>
        <span class="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock class="h-3 w-3" />
          {{ formatDuration(result.startTime, result.endTime) }}
        </span>
      </div>
    </div>
    <div
      v-if="results.length === 0"
      class="p-4 text-center text-xs text-muted-foreground"
    >
      No nodes executed.
    </div>
  </div>
</template>
