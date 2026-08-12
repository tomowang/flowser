<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { WorkflowService } from "@/lib/services/workflow-service";
import { IWorkflow } from "@/lib/types";
import { RouterLink } from "vue-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Trash2,
  Calendar,
  GitCommitHorizontal,
  Clock,
  FileUp,
  Play,
} from "@lucide/vue";
import { toast } from "vue-sonner";
import CardAction from "@/components/ui/card/CardAction.vue";
import logoUrl from "@/assets/logo.svg";
import { Spinner } from "@/components/ui/spinner";
import { WorkflowRunner } from "@/lib/engine/WorkflowRunner";
import { ExecutionService } from "@/lib/services/execution-service";

const { t } = useI18n();
const workflows = ref<IWorkflow[]>([]);
const searchQuery = ref("");
const isDeleteDialogOpen = ref(false);
const workflowToDeleteId = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const filteredWorkflows = computed(() => {
  if (!searchQuery.value) return workflows.value;
  const query = searchQuery.value.toLowerCase();
  return workflows.value.filter((wf) => wf.name.toLowerCase().includes(query));
});

const loadWorkflows = async () => {
  workflows.value = await WorkflowService.getAllWorkflows();
};

onMounted(async () => {
  await loadWorkflows();
});

const triggerImport = () => {
  fileInput.value?.click();
};

const handleImport = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string;
      const importedData = JSON.parse(content);

      if (!importedData.nodes || !importedData.edges) {
        throw new Error("Invalid workflow format");
      }

      const newWorkflow: IWorkflow = {
        id: crypto.randomUUID(),
        name: importedData.name || t("workflowEditor.untitledWorkflow"),
        nodes: importedData.nodes,
        edges: importedData.edges,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        active: false,
      };

      await WorkflowService.saveWorkflow(newWorkflow);
      await loadWorkflows();
      toast.success(t("workflows.importSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(t("workflows.importError"));
    } finally {
      target.value = ""; // Reset input
    }
  };
  reader.readAsText(file);
};

const openDeleteDialog = (e: Event, id: string) => {
  e.preventDefault(); // Prevent RouterLink navigation
  workflowToDeleteId.value = id;
  isDeleteDialogOpen.value = true;
};

const confirmDelete = async () => {
  if (!workflowToDeleteId.value) return;

  try {
    await WorkflowService.deleteWorkflow(workflowToDeleteId.value);
    await loadWorkflows();
    toast.success(t("workflows.deleted"));
  } catch (error) {
    console.error(error);
    toast.error(t("common.error"));
  } finally {
    isDeleteDialogOpen.value = false;
    workflowToDeleteId.value = null;
  }
};

const onToggleActive = async (checked: boolean, wf: IWorkflow) => {
  wf.active = checked;

  try {
    await WorkflowService.updateWorkflowStatus(wf.id, checked);
  } catch (error) {
    console.error(error);
    wf.active = !checked; // Revert
    toast.error(t("common.error"));
  }
};

const executingWorkflows = ref<Record<string, boolean>>({});

const runWorkflow = async (e: Event, wf: IWorkflow) => {
  e.preventDefault(); // Prevent RouterLink navigation
  if (executingWorkflows.value[wf.id]) return;
  executingWorkflows.value[wf.id] = true;

  try {
    const promise = (async () => {
      const runner = new WorkflowRunner(wf);
      const result = await runner.run();
      await ExecutionService.saveExecution(result);
      if (result.status === "error") {
        throw new Error(t("workflows.executionError"));
      }
      return result;
    })();

    toast.promise(promise, {
      loading: t("workflows.executing"),
      success: t("workflows.executionSuccess"),
      error: (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        if (message === "No trigger node found") {
          return t("workflowEditor.noTriggerNode");
        }
        return message || t("workflows.executionError");
      },
    });

    await promise;
  } catch (error) {
    console.error(error);
  } finally {
    executingWorkflows.value[wf.id] = false;
  }
};
</script>

<template>
  <div class="p-8 w-full mx-auto">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold tracking-tight mb-2">
          {{ t("workflows.title") }}
        </h1>
        <p class="text-muted-foreground">
          {{ t("workflows.description") }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          class="hidden"
          @change="handleImport"
        />
        <Button variant="outline" @click="triggerImport">
          <FileUp class="mr-2 h-4 w-4" />
          {{ t("workflows.importWorkflow") }}
        </Button>
        <RouterLink to="/workflows/new">
          <Button>
            <Plus class="mr-2 h-4 w-4" />
            {{ t("workflows.newWorkflow") }}
          </Button>
        </RouterLink>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="relative mb-8">
      <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        v-model="searchQuery"
        class="pl-9 h-10 w-full"
        :placeholder="t('workflows.searchPlaceholder')"
      />
    </div>

    <div
      class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
    >
      <Card
        v-for="wf in filteredWorkflows"
        :key="wf.id"
        class="h-full py-4 pt-0 gap-2 hover:border-primary/20 transition-all duration-200 overflow-hidden flex flex-col"
      >
        <RouterLink
          :to="`/workflows/${wf.id}`"
          class="flex flex-col py-4 gap-2"
        >
          <!-- Preview Section (Custom part of card) -->
          <div
            class="aspect-video bg-muted/30 relative overflow-hidden border-b"
          >
            <template v-if="wf.previewSvg">
              <img
                :src="`data:image/svg+xml;utf8,${encodeURIComponent(wf.previewSvg)}`"
                class="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
              />
            </template>
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-muted-foreground/30"
              style="background-image: radial-gradient(var(--canvas-dot) 1px, transparent 1px); background-size: 16px 16px;"
            >
              <img :src="logoUrl" class="h-12 w-12 opacity-60" />
            </div>
          </div>

          <CardHeader class="group">
            <CardTitle
              class="text-lg font-display line-clamp-1 group-hover:text-primary transition-colors"
              >{{ wf.name }}</CardTitle
            >
            <CardAction
              class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md cursor-pointer z-10"
              :title="t('common.delete')"
              @click.stop.prevent="openDeleteDialog($event, wf.id)"
            >
              <Trash2 class="h-4 w-4" />
            </CardAction>
          </CardHeader>

          <CardContent class="flex flex-col gap-2 font-mono">
            <div class="flex items-center gap-1.5">
              <GitCommitHorizontal class="h-3.5 w-3.5" />
              <span>{{
                t(
                  "workflows.nodes",
                  {
                    count: wf.nodes.length,
                  },
                  wf.nodes.length,
                )
              }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Calendar class="h-3.5 w-3.5" />
              <span>{{
                t("workflows.updatedAt", {
                  date: new Date(wf.updatedAt).toLocaleDateString(),
                })
              }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Clock class="h-3.5 w-3.5" />
              <span>{{
                t("workflows.createdAt", {
                  date: new Date(wf.createdAt).toLocaleDateString(),
                })
              }}</span>
            </div>
          </CardContent>
        </RouterLink>
        <CardFooter class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Switch
              v-model="wf.active"
              class="data-[state=checked]:bg-[#1db954]"
              @update:model-value="() => onToggleActive(wf.active, wf)"
            />
            <span
              class="text-sm font-medium"
              :class="wf.active ? 'text-green-600' : 'text-muted-foreground'"
            >
              {{ wf.active ? t("workflows.active") : t("workflows.inactive") }}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            :disabled="executingWorkflows[wf.id]"
            class="cursor-pointer z-10"
            @click.stop.prevent="runWorkflow($event, wf)"
          >
            <Spinner v-if="executingWorkflows[wf.id]" class="w-4 h-4 mr-1" />
            <Play v-else class="w-4 h-4 mr-1" />
            {{ t("workflows.execute") }}
          </Button>
        </CardFooter>
      </Card>

      <!-- Empty State -->
      <div
        v-if="filteredWorkflows.length === 0"
        class="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-xl"
      >
        <Search class="h-10 w-10 mb-4 opacity-20" />
        <p v-if="searchQuery">{{ t("workflows.noResults") }}</p>
        <p v-else>{{ t("workflows.noWorkflowsFound") }}</p>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="isDeleteDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t("common.confirm") }}</DialogTitle>
          <DialogDescription>
            {{ t("common.confirmDelete") }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="isDeleteDialogOpen = false">
            {{ t("common.cancel") }}
          </Button>
          <Button variant="destructive" @click="confirmDelete">
            {{ t("common.delete") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
