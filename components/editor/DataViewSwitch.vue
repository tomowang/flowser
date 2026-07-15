<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const model = defineModel<"schema" | "json">({ required: true });

const { t } = useI18n();

// Single-mode toggle groups emit an empty value when the active item is
// clicked again; ignore that so one view is always selected.
const onUpdate = (value: unknown) => {
  if (value === "schema" || value === "json") {
    model.value = value;
  }
};
</script>

<template>
  <ToggleGroup
    type="single"
    variant="outline"
    size="sm"
    :model-value="model"
    @update:model-value="onUpdate"
  >
    <ToggleGroupItem value="schema" :aria-label="t('workflowEditor.schema')">
      {{ t("workflowEditor.schema") }}
    </ToggleGroupItem>
    <ToggleGroupItem value="json" :aria-label="t('workflowEditor.jsonView')">
      {{ t("workflowEditor.jsonView") }}
    </ToggleGroupItem>
  </ToggleGroup>
</template>
