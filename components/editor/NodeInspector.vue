<script setup lang="ts">
import { computed } from "vue";
import { Registry } from "@/lib/nodes/registry";
import { INodeProperties } from "@/lib/types";

const props = defineProps<{
  node: any; // The selected node object from Vue Flow
}>();

const emit = defineEmits(["update:data"]);

// Get node type definition
const nodeType = computed(() => {
  if (!props.node) return null;
  return Registry.get(props.node.data.nodeType);
});

const properties = computed(() => nodeType.value?.description.properties || []);

const updateValue = (key: string, value: any) => {
  const newData = { ...props.node.data, [key]: value };
  emit("update:data", newData);
};
</script>

<template>
  <div v-if="node && nodeType" class="space-y-4">
    <div>
      <h3 class="font-medium text-lg">
        {{ nodeType.description.displayName }}
      </h3>
      <p class="text-xs text-muted-foreground">
        {{ nodeType.description.description }}
      </p>
    </div>

    <!-- Properties Form -->
    <div class="space-y-3">
      <div
        v-for="prop in properties"
        :key="prop.name"
        class="flex flex-col gap-1"
      >
        <label class="text-sm font-medium">{{ prop.displayName }}</label>

        <!-- String Input -->
        <input
          v-if="prop.type === 'string'"
          type="text"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          :value="node.data[prop.name] ?? prop.default"
          :placeholder="prop.placeholder"
          @input="
            (e) => updateValue(prop.name, (e.target as HTMLInputElement).value)
          "
        />

        <!-- Options Select -->
        <select
          v-else-if="prop.type === 'options'"
          class="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
          :value="node.data[prop.name] ?? prop.default"
          @change="
            (e) => updateValue(prop.name, (e.target as HTMLSelectElement).value)
          "
        >
          <option
            v-for="opt in prop.options"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.name }}
          </option>
        </select>

        <!-- JSON/Textarea -->
        <textarea
          v-else-if="prop.type === 'json' || prop.type === 'code'"
          class="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          :value="node.data[prop.name] ?? prop.default"
          @input="
            (e) =>
              updateValue(prop.name, (e.target as HTMLTextAreaElement).value)
          "
        ></textarea>

        <!-- Boolean/Switch (Basic checkbox for now) -->
        <div
          v-else-if="prop.type === 'boolean'"
          class="flex items-center space-x-2"
        >
          <input
            type="checkbox"
            :checked="node.data[prop.name] ?? prop.default"
            @change="
              (e) =>
                updateValue(prop.name, (e.target as HTMLInputElement).checked)
            "
          />
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-muted-foreground text-sm">
    Select a node to edit properties.
  </div>
</template>
