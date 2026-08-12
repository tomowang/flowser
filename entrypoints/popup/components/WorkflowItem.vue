<script lang="ts" setup>
import { IWorkflow } from "@/lib/types";
import { MoreVertical, Play, Trash2, Power } from "@lucide/vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

defineProps<{
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
    class="flex items-center justify-between p-3 border-b hover:bg-accent transition-colors"
  >
    <div class="flex-1 min-w-0 mr-3">
      <div
        class="font-display font-medium truncate text-sm text-foreground"
      >
        {{ workflow.name }}
      </div>
      <div class="text-xs font-mono text-muted-foreground truncate">
        {{ formatDate(workflow.updatedAt) }}
      </div>
    </div>

    <div class="flex items-center gap-1">
      <button
        class="p-1.5 rounded-sm hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
        title="Run Workflow"
        @click="emit('run', workflow.id)"
      >
        <Play class="w-4 h-4" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            class="p-1.5 rounded-sm hover:bg-accent text-muted-foreground transition-colors"
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
            class="text-destructive focus:text-destructive focus:bg-destructive/10"
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
