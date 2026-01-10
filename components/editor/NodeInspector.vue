<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Registry } from "@/lib/nodes/registry";
import { CredentialService } from "@/lib/services/credential-service";
import { Codemirror } from "vue-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-vue-next";
import CreateCredentialModal from "@/components/editor/CreateCredentialModal.vue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const props = defineProps<{
  node: any; // The selected node object from Vue Flow
}>();

const emit = defineEmits(["update:data"]);

const dynamicOptions = ref<Record<string, { name: string; value: string }[]>>(
  {},
);

// Get node type definition
const nodeType = computed(() => {
  if (!props.node) return null;
  return Registry.get(props.node.data.nodeType);
});

const isCreateCredentialOpen = ref(false);
const credentialTypeForCreation = ref<string>("");
const currentCredentialPropName = ref<string>("");

const loadCredentials = async () => {
  dynamicOptions.value = {};
  if (!nodeType.value) return;

  for (const prop of nodeType.value.description.properties) {
    if (prop.type === "credential") {
      try {
        const creds = await CredentialService.getCredentials();
        const filtered = prop.credentialType
          ? creds.filter((c) => c.type === prop.credentialType)
          : creds;

        dynamicOptions.value[prop.name] = filtered.map((c) => ({
          name: c.name,
          value: c.id,
        }));
      } catch (e) {
        console.warn("Failed to load credentials for inspector", e);
      }
    }
  }
};

// Load dynamic options (like credentials)
watch(
  () => props.node?.id,
  () => {
    loadCredentials();
  },
  { immediate: true },
);

const openCreateCredentialModal = (type: string, propName: string) => {
  credentialTypeForCreation.value = type;
  currentCredentialPropName.value = propName;
  isCreateCredentialOpen.value = true;
};

const onCredentialCreated = async (newId: string) => {
  await loadCredentials();
  if (currentCredentialPropName.value) {
    updateValue(currentCredentialPropName.value, newId);
  }
};

const properties = computed(() => {
  const staticProps = nodeType.value?.description.properties || [];
  return staticProps.map((p) => {
    if (dynamicOptions.value[p.name]) {
      // Create a new object to avoid mutating the registry definition permanently in a wrong way
      // though here we are just returning a new mapped array config
      return {
        ...p,
        options: dynamicOptions.value[p.name],
      };
    }
    return p;
  });
});

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
        <Select
          v-else-if="prop.type === 'options'"
          :model-value="node.data[prop.name] ?? prop.default"
          @update:model-value="(val) => updateValue(prop.name, val)"
        >
          <SelectTrigger>
            <SelectValue :placeholder="prop.placeholder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in prop.options"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.name }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Credential Select -->

        <div
          v-else-if="prop.type === 'credential'"
          class="flex gap-2"
        >
          <Select
            :model-value="node.data[prop.name] ?? prop.default"
            @update:model-value="(val) => updateValue(prop.name, val)"
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Select a credential" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in prop.options"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            class="shrink-0"
            @click="openCreateCredentialModal(prop.credentialType || '', prop.name)"
            title="Create new credential"
          >
            <Plus class="h-4 w-4" />
          </Button>
        </div>

        <!-- JSON/Code Editor -->
        <Codemirror
          v-else-if="prop.type === 'json' || prop.type === 'code'"
          :model-value="node.data[prop.name] ?? prop.default"
          :style="{ height: '300px' }"
          :autofocus="false"
          :indent-with-tab="true"
          :tab-size="2"
          :extensions="[prop.type === 'json' ? json() : javascript()]"
          @update:model-value="(val) => updateValue(prop.name, val)"
        />

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


  <CreateCredentialModal
    v-model:open="isCreateCredentialOpen"
    :default-type="credentialTypeForCreation"
    @created="onCredentialCreated"
  />
</template>
