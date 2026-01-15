<script lang="ts" setup>
import { IWorkflow } from "@/lib/types";
import { MoreVertical, Play, Trash2, Power } from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const props = defineProps<{
  workflow: IWorkflow;
}>();

const emit = defineEmits<{
  (e: "run", id: string): void;
  (e: "delete", id: string): void;
  (e: "toggle", id: string, active: boolean): void;
}>();

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};
</script>

<template>
  <div
    class="flex items-center justify-between p-3 border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
  >
    <div class="flex-1 min-w-0 mr-3">
      <div
        class="font-medium truncate text-sm text-gray-900 dark:text-gray-100"
      >
        {{ workflow.name }}
      </div>
      <div class="text-xs text-gray-500 truncate">
        {{ formatDate(workflow.updatedAt) }}
      </div>
    </div>

    <div class="flex items-center gap-1">
      <button
        class="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-green-600 transition-colors"
        @click="emit('run', workflow.id)"
        title="Run Workflow"
      >
        <Play class="w-4 h-4" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            class="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
          >
            <MoreVertical class="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            @select="emit('toggle', workflow.id, !workflow.active)"
          >
            <Power class="w-4 h-4 mr-2" />
            {{ workflow.active ? "Deactivate" : "Activate" }}
          </DropdownMenuItem>
          <DropdownMenuItem
            class="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10"
            @select="emit('delete', workflow.id)"
          >
            <Trash2 class="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>
