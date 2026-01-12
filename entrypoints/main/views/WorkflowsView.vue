<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { WorkflowService } from "@/lib/services/workflow-service";
import { IWorkflow } from "@/lib/types";
import { RouterLink } from "vue-router";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-vue-next";

const { t } = useI18n();
const workflows = ref<IWorkflow[]>([]);

onMounted(async () => {
  workflows.value = await WorkflowService.getAllWorkflows();
});
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold tracking-tight">
        {{ t("workflows.title") }}
      </h1>
      <RouterLink to="/workflows/new">
        <Button>
          <Plus class="mr-2 h-4 w-4" />
          {{ t("workflows.newWorkflow") }}
        </Button>
      </RouterLink>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="wf in workflows"
        :key="wf.id"
        :to="`/workflows/${wf.id}`"
        class="block"
      >
        <div
          class="bg-card hover:bg-accent/50 border rounded-lg p-4 transition-colors relative overflow-hidden group"
        >
          <div class="flex gap-4 items-center mb-2 relative z-10">
            <!-- Preview image background or content -->
            <div v-if="wf.previewSvg" class="h-16 bg-muted/20 rounded-md overflow-hidden flex items-center justify-center border">
              <img :src="`data:image/svg+xml;utf8,${encodeURIComponent(wf.previewSvg)}`" class="w-full h-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
            </div>
            <div>
              <h3 class="font-semibold text-lg mb-1">{{ wf.name }}</h3>
              <p class="text-sm text-muted-foreground">
                {{ t("workflows.lastUpdated") }}
                {{ new Date(wf.updatedAt).toLocaleDateString() }}
              </p>
            </div>
          </div>

          <div class="mt-4 flex items-center text-xs text-muted-foreground relative z-10">
            <span>{{ wf.nodes.length }} {{ t("workflows.nodes") }}</span>
            <span class="mx-2">•</span>
            <span>{{
              wf.active ? t("workflows.active") : t("workflows.inactive")
            }}</span>
          </div>
        </div>
      </RouterLink>

      <div
        v-if="workflows.length === 0"
        class="col-span-full text-center py-10 text-muted-foreground"
      >
        {{ t("workflows.noWorkflowsFound") }}
      </div>
    </div>
  </div>
</template>
