<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { ExecutionService } from "@/lib/services/execution-service";
import { WorkflowService } from "@/lib/services/workflow-service";
import { IWorkflow, IWorkflowExecutionResult } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import ExecutionPanel from "@/components/editor/execution/ExecutionPanel.vue";
import { Button } from "@/components/ui/button";
import { Trash2, Eye, RefreshCcw } from "@lucide/vue";

const { t } = useI18n();
const executions = ref<IWorkflowExecutionResult[]>([]);
const workflows = ref<IWorkflow[]>([]);
const selectedExecution = ref<IWorkflowExecutionResult | null>(null);
const isSheetOpen = ref(false);

const statusFilter = ref("all");
const workflowFilter = ref("all");
const currentPage = ref(1);
const pageSize = 10;

const loadExecutions = async () => {
  executions.value = await ExecutionService.getExecutions();
};

const loadWorkflows = async () => {
  workflows.value = await WorkflowService.getAllWorkflows();
};

const filteredExecutions = computed(() => {
  return executions.value.filter((exec) => {
    const matchesStatus =
      statusFilter.value === "all" || exec.status === statusFilter.value;
    const matchesWorkflow =
      workflowFilter.value === "all" ||
      exec.workflowId === workflowFilter.value;
    return matchesStatus && matchesWorkflow;
  });
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredExecutions.value.length / pageSize)),
);

const paginatedExecutions = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredExecutions.value.slice(start, start + pageSize);
});

watch([statusFilter, workflowFilter], () => {
  currentPage.value = 1;
});

watch(totalPages, (total) => {
  if (currentPage.value > total) {
    currentPage.value = total;
  }
});

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
  loadWorkflows();
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

    <div class="flex items-center gap-3 shrink-0">
      <Select v-model="statusFilter">
        <SelectTrigger class="w-[160px]">
          <SelectValue :placeholder="t('executions.status')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ t("executions.allStatuses") }}</SelectItem>
          <SelectItem value="success">{{ t("executions.success") }}</SelectItem>
          <SelectItem value="error">{{ t("executions.error") }}</SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="workflowFilter">
        <SelectTrigger class="w-[220px]">
          <SelectValue :placeholder="t('executions.workflow')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ t("executions.allWorkflows") }}</SelectItem>
          <SelectItem
            v-for="workflow in workflows"
            :key="workflow.id"
            :value="workflow.id"
          >
            {{ workflow.name }}
          </SelectItem>
        </SelectContent>
      </Select>
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
          <TableRow v-for="exec in paginatedExecutions" :key="exec.id">
            <TableCell>
              <div class="flex items-center gap-2">
                <span
                  class="block w-2 h-2 rounded-full"
                  :class="
                    exec.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                  "
                ></span>
                <span class="capitalize text-sm">{{
                  exec.status === 'success' ? t('executions.success') : t('executions.error')
                }}</span>
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
          <TableRow v-if="filteredExecutions.length === 0">
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

    <div
      v-if="filteredExecutions.length > 0"
      class="flex items-center justify-between shrink-0"
    >
      <span class="text-sm text-muted-foreground shrink-0 whitespace-nowrap">
        {{ t("executions.pageInfo", { current: currentPage, total: totalPages }) }}
      </span>
      <Pagination
        v-model:page="currentPage"
        :total="filteredExecutions.length"
        :items-per-page="pageSize"
        :sibling-count="1"
        show-edges
      >
        <PaginationContent v-slot="{ items }">
          <PaginationFirst />
          <PaginationPrevious />
          <template v-for="(item, index) in items">
            <PaginationItem
              v-if="item.type === 'page'"
              :key="index"
              :value="item.value"
              :is-active="item.value === currentPage"
            >
              {{ item.value }}
            </PaginationItem>
            <PaginationEllipsis v-else :key="`ellipsis-${index}`" />
          </template>
          <PaginationNext />
          <PaginationLast />
        </PaginationContent>
      </Pagination>
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
