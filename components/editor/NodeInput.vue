<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { IDisplayOptions, INodeProperties } from "@/lib/types";
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
import {
  codeAutocompleteExtension,
  expressionAutocompleteExtension,
} from "@/lib/editor/autocomplete";
import { EditorView } from "@codemirror/view";
import { CronLight } from "@vue-js-cron/light";
import "@vue-js-cron/light/dist/light.css";
import { Button } from "@/components/ui/button";
import {
  FunctionSquare,
  Type,
  RefreshCw,
  Loader2,
  Trash2,
} from "lucide-vue-next";

const props = defineProps<{
  modelValue: unknown;
  property: INodeProperties;
  loading?: boolean;
}>();

const emit = defineEmits(["update:modelValue", "refresh"]);

const isExpression = ref(false);

// Initialize mode based on value
watch(
  () => props.modelValue,
  (val) => {
    if (
      !props.property.noDataExpression &&
      typeof val === "string" &&
      val.startsWith("=")
    ) {
      isExpression.value = true;
    } else {
      isExpression.value = false;
    }
  },
  { immediate: true },
);

const displayValue = computed({
  get: () => {
    if (isExpression.value) {
      return (props.modelValue as string) ?? "";
    }
    return props.modelValue;
  },
  set: (val) => {
    emit("update:modelValue", val);
  },
});

const expressionValue = computed({
  get: () => {
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

const checkDisplayOptions = (
  options: IDisplayOptions,
  values: Record<string, unknown>,
): boolean => {
  if (!options) return true;
  if (!values) return true;
  if (options.show) {
    for (const key in options.show) {
      const showValues = options.show[key];
      const actualValue = values[key];
      if (Array.isArray(showValues) && !(showValues as unknown[]).includes(actualValue)) {
        return false;
      }
    }
  }
  if (options.hide) {
    for (const key in options.hide) {
      const hideValues = options.hide[key];
      const actualValue = values[key];
      if (Array.isArray(hideValues) && (hideValues as unknown[]).includes(actualValue)) {
        return false;
      }
    }
  }
  return true;
};

// Extension for making CodeMirror look like a single-line input
const singleLineExtension = [
  EditorView.theme({
    "&": { backgroundColor: "transparent" },
    ".cm-content": { padding: "0" },
    ".cm-line": { padding: "0" },
    "&.cm-focused": { outline: "none" },
    ".cm-gutters": {
      display: "none",
      border: "none",
      backgroundColor: "transparent",
    },
  }),
  EditorView.lineWrapping,
];
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="flex items-center justify-between h-6">
      <label class="text-sm font-medium">{{ property.displayName }}</label>

      <!-- Mode Toggle -->
      <div
        v-if="
          property.type !== 'json' &&
          property.type !== 'code' &&
          !property.noDataExpression
        "
        class="flex items-center rounded-md border bg-muted p-0.25 origin-right"
      >
        <button
          class="flex items-center gap-1 rounded-sm px-1.5 py-0 text-[10px] font-medium transition-colors"
          :class="
            !isExpression
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:bg-background/50'
          "
          @click="toggleMode('fixed')"
        >
          <Type class="h-2.5 w-2.5" />
          Fixed
        </button>
        <button
          class="flex items-center gap-1 rounded-sm px-1.5 py-0 text-[10px] font-medium transition-colors"
          :class="
            isExpression
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:bg-background/50'
          "
          @click="toggleMode('expression')"
        >
          <FunctionSquare class="h-2.5 w-2.5" />
          Expression
        </button>
      </div>
    </div>

    <!-- Expression Input -->
    <div
      v-if="isExpression"
      class="flex items-center gap-1 relative rounded-md border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring bg-transparent min-h-9"
    >
      <div
        class="pl-2 pr-1 flex items-center mt-[1px] text-muted-foreground font-mono text-xs select-none"
      >
        =
      </div>
      <div class="w-full relative flex-1 flex py-1 pr-2">
        <Codemirror
          v-model="expressionValue as string"
          :style="{ width: '100%', minHeight: '20px' }"
          :autofocus="true"
          :extensions="[
            javascript(),
            expressionAutocompleteExtension,
            singleLineExtension,
          ]"
          class="w-full text-sm font-mono overflow-hidden"
          placeholder="Expression..."
        />
      </div>
    </div>

    <!-- Fixed Inputs -->
    <div v-else>
      <!-- String Input -->
      <input
        v-if="property.type === 'string' || property.type === 'password'"
        v-model="displayValue as string"
        :type="property.type === 'password' ? 'password' : 'text'"
        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        :placeholder="property.placeholder"
      />

      <!-- Textarea Input -->
      <textarea
        v-else-if="property.type === 'textarea'"
        v-model="displayValue as string"
        :rows="property.typeOptions?.rows || 3"
        class="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        :placeholder="property.placeholder"
      />

      <!-- Number Input -->
      <input
        v-else-if="property.type === 'number'"
        v-model.number="displayValue as number"
        type="number"
        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        :placeholder="property.placeholder"
      />

      <!-- Options Select -->
      <div v-else-if="property.type === 'options'" class="flex gap-2">
        <Select v-model="displayValue as string">
          <SelectTrigger class="w-full">
            <SelectValue :placeholder="property.placeholder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in property.options"
              :key="opt.value ?? opt.name"
              :value="opt.value ?? opt.name"
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
          title="Refresh options"
          @click="$emit('refresh')"
        >
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          <RefreshCw v-else class="h-4 w-4" />
        </Button>
      </div>

      <!-- JSON/Code Editor -->
      <Codemirror
        v-else-if="property.type === 'json' || property.type === 'code'"
        v-model="displayValue as string"
        :style="{ height: property.typeOptions?.rows ? (property.typeOptions.rows * 20) + 'px' : (property.type === 'code' ? '300px' : '200px') }"
        :autofocus="false"
        :indent-with-tab="true"
        :tab-size="2"
        :extensions="[
          property.type === 'json' ? json() : javascript(),
          property.type === 'code' ? codeAutocompleteExtension : [],
        ]"
      />

      <!-- Boolean/Switch -->
      <div
        v-else-if="property.type === 'boolean'"
        class="flex items-center space-x-2"
      >
        <input
          v-model="displayValue as boolean"
          type="checkbox"
          class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
      </div>

      <!-- Cron Editor -->
      <div v-else-if="property.type === 'cron'" class="flex flex-col gap-2">
        <div class="text-xs font-mono bg-muted p-2 rounded">
          {{ displayValue }}
        </div>
        <CronLight v-model="displayValue as string" locale="en" />
      </div>

      <!-- Fixed Collection -->
      <div
        v-else-if="property.type === 'fixedCollection'"
        class="flex flex-col gap-4"
      >
        <div
          v-for="option in property.options"
          :key="option.name"
          class="flex flex-col gap-2"
        >
          <label class="text-sm font-medium">{{
            option.displayName || option.name
          }}</label>

          <div class="flex flex-col gap-2">
            <div
              v-for="(item, index) in (displayValue as Record<string, unknown[]>)?. [option.name] || []"
              :key="index"
              class="relative rounded-md border p-4 pt-8 flex flex-col gap-2 group"
            >
              <!-- Remove Button -->
              <button
                class="absolute right-2 top-2 p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                title="Remove Item"
                @click="
                  () => {
                    const newValue = { ...(displayValue as Record<string, unknown[]>) };
                    newValue[option.name] = newValue[option.name].filter(
                      (_, i: number) => i !== index,
                    );
                    emit('update:modelValue', newValue);
                  }
                "
              >
                <Trash2 class="h-4 w-4" />
              </button>

              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="subProp in option.values"
                  :key="subProp.name"
                  :class="{
                    'col-span-1': subProp.colSpan === 1,
                    'col-span-2': subProp.colSpan === 2,
                    'col-span-3': subProp.colSpan === 3 || !subProp.colSpan,
                  }"
                >
                  <NodeInput
                    v-if="
                      !subProp.displayOptions ||
                      checkDisplayOptions(subProp.displayOptions, item as Record<string, unknown>)
                    "
                    :model-value="(item as Record<string, unknown>)[subProp.name] ?? subProp.default"
                    :property="subProp"
                    @update:model-value="
                      (val) => {
                        const newValue = { ...(displayValue as Record<string, unknown[]>) };
                        if (!newValue[option.name]) newValue[option.name] = [];
                        const newItems = [...(newValue[option.name])];
                        newItems[index] = { ...(newItems[index] as Record<string, unknown>), [subProp.name]: val };
                        newValue[option.name] = newItems;
                        emit('update:modelValue', newValue);
                      }
                    "
                    @refresh="$emit('refresh')"
                  />
                </div>
              </div>
            </div>


            <Button
              variant="outline"
              size="sm"
              class="w-full"
              @click="
                () => {
                  const newValue = { ...(displayValue as Record<string, unknown[]> || {}) };
                  if (!newValue[option.name]) newValue[option.name] = [];

                  // Initialize new item with defaults
                  const newItem: Record<string, unknown> = {};
                  if (option.values) {
                    for (const subProp of option.values) {
                      if (subProp.default !== undefined) {
                        newItem[subProp.name] = subProp.default;
                      }
                    }
                  }

                  newValue[option.name] = [
                    ...newValue[option.name],
                    newItem,
                  ];
                  emit('update:modelValue', newValue);
                }
              "
            >
              Add {{ option.displayName || option.name }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <p v-if="property.description" class="text-[10px] text-muted-foreground">
      {{ property.description }}
    </p>
  </div>
</template>
