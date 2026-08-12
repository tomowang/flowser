<script lang="ts" setup>
import { ref, onMounted, computed, watch } from "vue";
import { browser } from "wxt/browser";
import { useI18n } from "vue-i18n";
import { WorkflowService } from "@/lib/services/workflow-service";
import { SecurityService } from "@/lib/services/security-service";
import { MessageType } from "@/lib/messages";
import { IWorkflow } from "@/lib/types";
import { Search, ExternalLink } from "@lucide/vue";
import WorkflowItem from "./components/WorkflowItem.vue";
import { Input } from "@/components/ui/input";
import { toast } from "vue-sonner";
import { Toaster } from "@/components/ui/sonner";
import logo from "@/assets/logo.svg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const workflows = ref<IWorkflow[]>([]);
const searchQuery = ref("");
const loading = ref(false);

const showMasterKeyDialog = ref(false);
const masterKeyInput = ref("");
const pendingWorkflowId = ref<string | null>(null);
const verifyingKey = ref(false);
const isMasterKeyConfigured = ref(true);

watch(showMasterKeyDialog, async (newVal) => {
  if (newVal) {
    isMasterKeyConfigured.value = await SecurityService.isMasterKeyConfigured();
  }
});

const { t } = useI18n();

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

  if (!SecurityService.hasMasterKey()) {
    pendingWorkflowId.value = id;
    showMasterKeyDialog.value = true;
    return;
  }

  try {
    toast.info(t("workflows.executing") + ": " + workflow.name);
    const response = await browser.runtime.sendMessage({
      type: MessageType.WORKFLOW_EXECUTE,
      payload: { workflowId: id },
    });
    if (!response?.success) {
      throw new Error(response?.error || "Failed to trigger workflow execution");
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    toast.error(t("common.error") + ": " + errorMessage);
  }
};

const handleMasterKeySubmit = async () => {
  if (!masterKeyInput.value) return;

  verifyingKey.value = true;
  try {
    const key = await SecurityService.deriveKey(masterKeyInput.value);
    const isValid = await SecurityService.validateKey(key);

    if (isValid) {
      SecurityService.setMasterKey(key);
      await SecurityService.saveToSession(key);
      showMasterKeyDialog.value = false;
      masterKeyInput.value = "";

      if (pendingWorkflowId.value) {
        handleRun(pendingWorkflowId.value);
        pendingWorkflowId.value = null;
      }
    } else {
      toast.error(t("masterKey.invalidPassword"));
    }
  } catch (e) {
    console.error(e);
    toast.error(t("masterKey.failedToDeriveKey"));
  } finally {
    verifyingKey.value = false;
  }
};

const handleDelete = async (id: string) => {
  if (!confirm(t("common.confirmDelete"))) return;
  try {
    await WorkflowService.deleteWorkflow(id);
    await loadWorkflows();
    toast.success(t("workflows.deleted"));
  } catch {
    toast.error(t("common.error"));
  }
};

const handleToggle = async (id: string, active: boolean) => {
  try {
    await WorkflowService.updateWorkflowStatus(id, active);
    await loadWorkflows();
    toast.success(active ? t("workflows.active") : t("workflows.inactive"));
  } catch {
    toast.error(t("common.error"));
  }
};

const openDashboard = () => {
  browser.windows.create({
    url: browser.runtime.getURL("/main.html"),
    type: "popup",
  });
};

onMounted(async () => {
  await SecurityService.restoreFromSession();
  loadWorkflows();
});
</script>

<template>
  <div
    class="w-[400px] bg-background border-x border-b min-h-[300px] flex flex-col"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10"
    >
      <div class="font-display font-bold text-lg flex items-center gap-2">
        <img :src="logo" class="w-6 h-6" alt="Flowser" />
        Flowser
      </div>
      <button
        class="text-sm font-mono text-muted-foreground hover:text-foreground flex items-center gap-1"
        @click="openDashboard"
      >
        {{ t("popup.dashboard") }}
        <ExternalLink class="w-3 h-3" />
      </button>
    </div>

    <!-- Search -->
    <div class="p-3 border-b bg-muted/30">
      <div class="relative">
        <Search
          class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
        />
        <Input
          v-model="searchQuery"
          type="search"
          :placeholder="t('workflows.searchPlaceholder')"
          class="w-full bg-background pl-9"
        />
      </div>
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto max-h-[400px]">
      <div v-if="loading" class="p-8 text-center text-muted-foreground">
        {{ t("common.loading") }}
      </div>
      <div
        v-else-if="filteredWorkflows.length === 0"
        class="p-8 text-center text-muted-foreground"
      >
        {{ t("workflows.noWorkflowsFound") }}
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
    <Toaster
      position="top-center"
      rich-colors
      close-button
      close-button-position="top-right"
    />

    <Dialog v-model:open="showMasterKeyDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{
            isMasterKeyConfigured
              ? t("masterKey.title")
              : t("masterKey.titleInitial")
          }}</DialogTitle>
          <DialogDescription>
            {{
              isMasterKeyConfigured
                ? t("masterKey.description")
                : t("masterKey.descriptionInitial")
            }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="master-key" class="text-right">
              {{
                isMasterKeyConfigured
                  ? t("masterKey.passwordPlaceholder")
                  : t("masterKey.passwordPlaceholderInitial")
              }}
            </Label>
            <Input
              id="master-key"
              v-model="masterKeyInput"
              type="password"
              class="col-span-3"
              auto-focus
              @keydown.enter="handleMasterKeySubmit"
            />
          </div>
        </div>
        <DialogFooter>
          <Button :disabled="verifyingKey" @click="handleMasterKeySubmit">
            {{
              verifyingKey
                ? isMasterKeyConfigured
                  ? t("masterKey.unlocking")
                  : t("masterKey.saving")
                : isMasterKeyConfigured
                  ? t("masterKey.unlock")
                  : t("masterKey.save")
            }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
