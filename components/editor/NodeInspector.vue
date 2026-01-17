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
import type { INodeCredentialDescription } from "@/lib/types";

const props = defineProps<{
  node: any; // The selected node object from Vue Flow
}>();

const emit = defineEmits(["update:data"]);

// Credential options: keyed by credential type name
const credentialOptions = ref<
  Record<string, { name: string; value: string }[]>
>({});

// Get node type definition
const nodeType = computed(() => {
  if (!props.node) return null;
  return Registry.get(props.node.data.nodeType);
});

const isCreateCredentialOpen = ref(false);
const credentialTypeForCreation = ref<string>("");
const currentCredentialName = ref<string>("");

const loadCredentials = async () => {
  credentialOptions.value = {};
  if (!nodeType.value) return;

  const credentials = nodeType.value.description.credentials || [];
  for (const cred of credentials) {
    try {
      const allCreds = await CredentialService.getCredentials();
      const filtered = allCreds.filter((c) => c.type === cred.name);

      credentialOptions.value[cred.name] = filtered.map((c) => ({
        name: c.name,
        value: c.id,
      }));
    } catch (e) {
      console.warn("Failed to load credentials for inspector", e);
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

const openCreateCredentialModal = (credType: string) => {
  credentialTypeForCreation.value = credType;
  currentCredentialName.value = credType;
  isCreateCredentialOpen.value = true;
};

const onCredentialCreated = async (newId: string) => {
  await loadCredentials();
  if (currentCredentialName.value) {
    updateCredentialValue(currentCredentialName.value, newId);
  }
};

// Get credentials from node type description
const credentials = computed<INodeCredentialDescription[]>(() => {
  return nodeType.value?.description.credentials || [];
});

const properties = computed(() => {
  return nodeType.value?.description.properties || [];
});

const updateValue = (key: string, value: any) => {
  const newData = { ...props.node.data, [key]: value };
  emit("update:data", newData);
};

// Update credential value in node data, stored as credentials[credType]
const updateCredentialValue = (credType: string, credId: string) => {
  const currentCredentials = props.node.data.credentials || {};
  const newData = {
    ...props.node.data,
    credentials: {
      ...currentCredentials,
      [credType]: credId,
    },
  };
  emit("update:data", newData);
};

const getCredentialValue = (credType: string): string => {
  return props.node.data.credentials?.[credType] || "";
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

    <!-- Credentials Section -->
    <div v-if="credentials.length > 0" class="space-y-3">
      <div
        v-for="cred in credentials"
        :key="cred.name"
        class="flex flex-col gap-1"
      >
        <label class="text-sm font-medium">{{
          cred.displayName || cred.name
        }}</label>
        <div class="flex gap-2">
          <Select
            :model-value="getCredentialValue(cred.name)"
            @update:model-value="
              (val) => updateCredentialValue(cred.name, val as string)
            "
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Select a credential" />
            </SelectTrigger>
            <SelectContent>
              <template v-if="credentialOptions[cred.name]?.length">
                <SelectItem
                  v-for="opt in credentialOptions[cred.name]"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.name }}
                </SelectItem>
              </template>
              <SelectItem v-else value="no-credentials" disabled>
                No credentials found
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            class="shrink-0"
            title="Create new credential"
            @click="openCreateCredentialModal(cred.name)"
          >
            <Plus class="h-4 w-4" />
          </Button>
        </div>
      </div>
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
