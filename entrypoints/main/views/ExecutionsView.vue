<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { ExecutionService } from "@/lib/services/execution-service";
import { IWorkflowExecutionResult } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ExecutionPanel from "@/components/editor/execution/ExecutionPanel.vue";
import { Button } from "@/components/ui/button";
import { Trash2, Eye, RefreshCcw } from "lucide-vue-next";

const { t } = useI18n();
const executions = ref<IWorkflowExecutionResult[]>([]);
const selectedExecution = ref<IWorkflowExecutionResult | null>(null);
const isSheetOpen = ref(false);

const loadExecutions = async () => {
  executions.value = await ExecutionService.getExecutions();
};

const deleteExecution = async (id: string) => {
  if (confirm(t("executions.deleteConfirm"))) {
    await ExecutionService.deleteExecution(id);
    await loadExecutions();
  }
};

const viewExecution = (execution: IWorkflowExecutionResult) => {
  selectedExecution.value = execution;
  isSheetOpen.value = true;
};

const formatDuration = (start: number, end: number) => {
  return `${end - start}ms`;
};

const formatDate = (ts: number) => {
  return new Date(ts).toLocaleString();
};

onMounted(() => {
  loadExecutions();
});
</script>

<template>
  <div class="h-full flex flex-col p-6 space-y-4 overflow-hidden">
    <div class="flex items-center justify-between shrink-0">
      <h1 class="text-2xl font-bold">{{ t("executions.title") }}</h1>
      <Button variant="outline" size="sm" @click="loadExecutions">
        <RefreshCcw class="w-4 h-4 mr-2" />
        {{ t("common.refresh") }}
      </Button>
    </div>

    <div class="border rounded-md flex-1 overflow-auto bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{{ t("executions.status") }}</TableHead>
            <TableHead>{{ t("executions.workflow") }}</TableHead>
            <TableHead>{{ t("executions.startTime") }}</TableHead>
            <TableHead>{{ t("executions.duration") }}</TableHead>
            <TableHead class="text-right">{{ t("common.actions") }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="exec in executions" :key="exec.id">
            <TableCell>
              <div class="flex items-center gap-2">
                <span
                  class="block w-2 h-2 rounded-full"
                  :class="
                    exec.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                  "
                ></span>
                <span class="capitalize text-sm">{{ exec.status }}</span>
              </div>
            </TableCell>
            <TableCell class="font-medium">{{
              exec.workflowName || exec.workflowId
            }}</TableCell>
            <TableCell>{{ formatDate(exec.startTime) }}</TableCell>
            <TableCell>{{
              formatDuration(exec.startTime, exec.endTime)
            }}</TableCell>
            <TableCell class="text-right">
              <div class="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  :title="t('executions.viewDetails')"
                  @click="viewExecution(exec)"
                >
                  <Eye class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="text-muted-foreground hover:text-destructive"
                  :title="t('executions.deleteLog')"
                  @click="deleteExecution(exec.id)"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="executions.length === 0">
            <TableCell
              colspan="5"
              class="text-center h-24 text-muted-foreground"
            >
              {{ t("executions.noExecutionsFound") }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <Sheet v-model:open="isSheetOpen">
      <!-- Widen the sheet to accommodate the execution panel -->
      <SheetContent
        class="w-[800px] sm:w-[800px] sm:max-w-none p-0 overflow-hidden"
      >
        <div class="h-full w-full pt-10">
          <ExecutionPanel
            v-if="selectedExecution && isSheetOpen"
            :execution-result="selectedExecution"
            class="h-full"
            @close="isSheetOpen = false"
          />
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
