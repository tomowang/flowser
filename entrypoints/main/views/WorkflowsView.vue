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
  CardDescription,
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
} from "lucide-vue-next";
import { toast } from "vue-sonner";
import CardAction from "@/components/ui/card/CardAction.vue";
import logoUrl from "@/assets/logo.svg";

const { t } = useI18n();
const workflows = ref<IWorkflow[]>([]);
const searchQuery = ref("");
const isDeleteDialogOpen = ref(false);
const workflowToDeleteId = ref<string | null>(null);

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
      <RouterLink to="/workflows/new">
        <Button>
          <Plus class="mr-2 h-4 w-4" />
          {{ t("workflows.newWorkflow") }}
        </Button>
      </RouterLink>
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
        class="h-full py-4 pt-0 gap-2 hover:shadow-lg hover:border-primary/20 transition-all duration-200 overflow-hidden flex flex-col"
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
            >
              <img :src="logoUrl" class="h-12 w-12 opacity-60" />
            </div>
          </div>

          <CardHeader class="group">
            <CardTitle
              class="text-lg line-clamp-1 group-hover:text-primary transition-colors"
              >{{ wf.name }}</CardTitle
            >
            <CardAction
              @click.stop.prevent="openDeleteDialog($event, wf.id)"
              class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md cursor-pointer z-10"
              :title="t('common.delete')"
            >
              <Trash2 class="h-4 w-4" />
            </CardAction>
          </CardHeader>

          <CardContent class="flex flex-col gap-2">
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
        <CardFooter class="">
          <div class="flex items-center gap-2">
            <Switch
              v-model="wf.active"
              @update:model-value="() => onToggleActive(wf.active, wf)"
            />
            <span
              class="text-sm font-medium"
              :class="wf.active ? 'text-green-600' : 'text-muted-foreground'"
            >
              {{ wf.active ? t("workflows.active") : t("workflows.inactive") }}
            </span>
          </div>
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
