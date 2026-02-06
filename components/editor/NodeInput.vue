<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { INodeProperties } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Codemirror } from "vue-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { CronLight } from "@vue-js-cron/light";
import "@vue-js-cron/light/dist/light.css";
import { Button } from "@/components/ui/button";
import { FunctionSquare, Type, RefreshCw, Loader2 } from "lucide-vue-next";

const props = defineProps<{
  modelValue: any;
  property: INodeProperties;
  loading?: boolean;
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);

const isExpression = ref(false);

// Initialize mode based on value
watch(
  () => props.modelValue,
  (val) => {
    if (typeof val === "string" && val.startsWith("=")) {
      isExpression.value = true;
    } else {
      // If we are already in expression mode and value clears or changes, stay in expression mode
      // unless it was explicitly switched. But here we are syncing from props.
      // If the value doesn't start with =, it strictly isn't an expression by new definition.
      // However, typing in expression mode might temporarily have no = if user deleted it?
      // No, we will enforce = in expression inputs or handle it.
      // Actually, standard n8n behavior: if it starts with =, it's expression.
      isExpression.value = false;
    }
  },
  { immediate: true },
);

const displayValue = computed({
  get: () => {
    if (isExpression.value) {
      // In expression mode, show raw value (which should start with =)
      // If somehow it doesn't, we show it as is.
      return props.modelValue ?? "";
    }
    return props.modelValue;
  },
  set: (val) => {
    emit("update:modelValue", val);
  },
});

const expressionValue = computed({
  get: () => {
    // Strip correct prefix for editing if we wanted to hide `=`, but n8n shows it.
    // The screenshot shows `{{ $json.content }}` with `fx` icon.
    // n8n actually hides the `=` in the UI input often but adds it in data.
    // But strictly speaking, for "Fixed | Expression" toggle:
    // If Expression mode, we expect value to start with `=`.
    // If the user types `{{ foo }}`, we save `={{ foo }}`.

    const val = props.modelValue as string;
    if (val && val.startsWith("=")) {
      return val.slice(1);
    }
    return val;
  },
  set: (val) => {
    // Always prepend =
    emit("update:modelValue", "=" + val);
  },
});

const toggleMode = (mode: "fixed" | "expression") => {
  if (mode === "expression") {
    if (!isExpression.value) {
      // Switch to expression: prepend =
      const current = props.modelValue ?? "";
      // If current is not string, stringify?
      let strVal = current;
      if (typeof current !== "string") {
        strVal = JSON.stringify(current);
      }
      emit("update:modelValue", "=" + (strVal || ""));
      isExpression.value = true;
    }
  } else {
    // Switch to fixed
    if (isExpression.value) {
      // Remove = prefix
      let strVal = props.modelValue as string;
      if (strVal && strVal.startsWith("=")) {
        strVal = strVal.slice(1);
      }

      // Attempt to restore type if needed?
      // For now, keep as string or try to parse if property type is not string?
      // Simplest is just keep as string for inputs, but for boolean/options we might need checks.

      if (props.property.type === "boolean") {
        if (strVal === "true") emit("update:modelValue", true);
        else if (strVal === "false") emit("update:modelValue", false);
        else emit("update:modelValue", false); // Fallback
      } else if (props.property.type === "number") {
        const num = Number(strVal);
        emit("update:modelValue", isNaN(num) ? 0 : num);
      } else {
        emit("update:modelValue", strVal);
      }
      isExpression.value = false;
    }
  }
};
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium">{{ property.displayName }}</label>

      <!-- Mode Toggle -->
      <div
        class="flex items-center rounded-md border bg-muted p-0.5"
        v-if="
          property.type !== 'json' &&
          property.type !== 'code' &&
          !property.noDataExpression
        "
      >
        <button
          class="flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium transition-colors"
          :class="
            !isExpression
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:bg-background/50'
          "
          @click="toggleMode('fixed')"
        >
          <Type class="h-3 w-3" />
          Fixed
        </button>
        <button
          class="flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium transition-colors"
          :class="
            isExpression
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:bg-background/50'
          "
          @click="toggleMode('expression')"
        >
          <FunctionSquare class="h-3 w-3" />
          Expression
        </button>
      </div>
    </div>

    <!-- Expression Input -->
    <div v-if="isExpression" class="flex items-center gap-1 relative">
      <div
        class="absolute left-2 top-2.5 text-muted-foreground font-mono text-xs select-none"
      >
        =
      </div>
      <input
        type="text"
        class="flex h-9 w-full rounded-md border border-input bg-transparent pl-6 pr-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
        v-model="expressionValue"
        placeholder="Expression..."
      />
    </div>

    <!-- Fixed Inputs -->
    <div v-else>
      <!-- String Input -->
      <!-- String Input -->
      <input
        v-if="property.type === 'string' || property.type === 'password'"
        :type="property.type === 'password' ? 'password' : 'text'"
        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        v-model="displayValue"
        :placeholder="property.placeholder"
      />

      <!-- Number Input -->
      <input
        v-else-if="property.type === 'number'"
        type="number"
        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        v-model.number="displayValue"
        :placeholder="property.placeholder"
      />

      <!-- Options Select -->
      <div v-else-if="property.type === 'options'" class="flex gap-2">
        <Select v-model="displayValue">
          <SelectTrigger class="w-full">
            <SelectValue :placeholder="property.placeholder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in property.options"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.name }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          v-if="property.typeOptions?.loadOptionsMethod"
          variant="outline"
          size="icon"
          class="shrink-0"
          :disabled="loading"
          @click="$emit('refresh')"
          title="Refresh options"
        >
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          <RefreshCw v-else class="h-4 w-4" />
        </Button>
      </div>

      <!-- JSON/Code Editor -->
      <Codemirror
        v-else-if="property.type === 'json' || property.type === 'code'"
        v-model="displayValue"
        :style="{ height: '100px' }"
        :autofocus="false"
        :indent-with-tab="true"
        :tab-size="2"
        :extensions="[property.type === 'json' ? json() : javascript()]"
      />

      <!-- Boolean/Switch -->
      <div
        v-else-if="property.type === 'boolean'"
        class="flex items-center space-x-2"
      >
        <input
          type="checkbox"
          v-model="displayValue"
          class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
      </div>

      <!-- Cron Editor -->
      <div v-else-if="property.type === 'cron'" class="flex flex-col gap-2">
        <div class="text-xs font-mono bg-muted p-2 rounded">
          {{ displayValue }}
        </div>
        <CronLight v-model="displayValue" locale="en" />
      </div>
    </div>

    <p v-if="property.description" class="text-[10px] text-muted-foreground">
      {{ property.description }}
    </p>
  </div>
</template>
