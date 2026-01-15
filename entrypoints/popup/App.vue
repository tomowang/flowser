<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import { browser } from "wxt/browser";
import { WorkflowService } from "@/lib/services/workflow-service";
import { WorkflowRunner } from "@/lib/engine/WorkflowRunner";
import { IWorkflow } from "@/lib/types";
import { Search, ExternalLink } from "lucide-vue-next";
import WorkflowItem from "./components/WorkflowItem.vue";
import { Input } from "@/components/ui/input";
import { toast } from "vue-sonner";
import { Toaster } from "@/components/ui/sonner";
import logo from "@/assets/logo.svg";

const workflows = ref<IWorkflow[]>([]);
const searchQuery = ref("");
const loading = ref(false);

const filteredWorkflows = computed(() => {
  if (!searchQuery.value) return workflows.value;
  const query = searchQuery.value.toLowerCase();
  return workflows.value.filter((w) => w.name.toLowerCase().includes(query));
});

const loadWorkflows = async () => {
  loading.value = true;
  try {
    const all = await WorkflowService.getAllWorkflows();
    workflows.value = all.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (e) {
    console.error("Failed to load workflows", e);
  } finally {
    loading.value = false;
  }
};

const handleRun = async (id: string) => {
  const workflow = workflows.value.find((w) => w.id === id);
  if (!workflow) return;

  try {
    toast.info(`Starting execution: ${workflow.name}`);
    const runner = new WorkflowRunner(workflow);
    const result = await runner.run();

    if (result.status === "success") {
      toast.success(`Execution successful: ${workflow.name}`);
    } else {
      toast.error(`Execution failed: ${workflow.name}`);
    }
  } catch (e: any) {
    toast.error(`Error running workflow: ${e.message}`);
  }
};

const handleDelete = async (id: string) => {
  if (!confirm("Are you sure you want to delete this workflow?")) return;
  try {
    await WorkflowService.deleteWorkflow(id);
    await loadWorkflows();
    toast.success("Workflow deleted");
  } catch (e) {
    toast.error("Failed to delete workflow");
  }
};

const handleToggle = async (id: string, active: boolean) => {
  try {
    await WorkflowService.updateWorkflowStatus(id, active);
    await loadWorkflows();
    toast.success(`Workflow ${active ? "activated" : "deactivated"}`);
  } catch (e) {
    toast.error("Failed to update status");
  }
};

const openDashboard = () => {
  browser.tabs.create({
    url: browser.runtime.getURL("/main.html"),
  });
};

onMounted(() => {
  loadWorkflows();
});
</script>

<template>
  <div
    class="w-[400px] bg-white dark:bg-gray-900 border-x border-b min-h-[300px] flex flex-col"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-900 sticky top-0 z-10"
    >
      <div class="font-semibold text-lg flex items-center gap-2">
        <img :src="logo" class="w-6 h-6" alt="Flowser" />
        Flowser
      </div>
      <button
        class="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 flex items-center gap-1"
        @click="openDashboard"
      >
        Dashboard
        <ExternalLink class="w-3 h-3" />
      </button>
    </div>

    <!-- Search -->
    <div class="p-3 border-b bg-gray-50 dark:bg-gray-800/50">
      <div class="relative">
        <Search
          class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400"
        />
        <Input
          v-model="searchQuery"
          type="search"
          placeholder="Search workflows..."
          class="w-full bg-white dark:bg-gray-900 pl-9"
        />
      </div>
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto max-h-[400px]">
      <div v-if="loading" class="p-8 text-center text-gray-500">Loading...</div>
      <div
        v-else-if="filteredWorkflows.length === 0"
        class="p-8 text-center text-gray-500"
      >
        No workflows found
      </div>
      <div v-else>
        <WorkflowItem
          v-for="workflow in filteredWorkflows"
          :key="workflow.id"
          :workflow="workflow"
          @run="handleRun"
          @delete="handleDelete"
          @toggle="handleToggle"
        />
      </div>
    </div>
    <Toaster />
  </div>
</template>
