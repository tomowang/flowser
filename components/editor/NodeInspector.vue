<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useVueFlow } from "@vue-flow/core";
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
import { CronLight } from "@vue-js-cron/light";
import "@vue-js-cron/light/dist/light.css";
import NodeInput from "./NodeInput.vue";

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

const { nodes } = useVueFlow();
const nameError = ref("");
const localName = ref("");

watch(
  () => props.node?.data?.label,
  (newLabel) => {
    // Only update local if it's different (e.g. external change)
    // and we are not currently editing (to avoid cursor jumping, though simple string sync is usually fine)
    if (newLabel && newLabel !== localName.value) {
      localName.value = newLabel;
    }
  },
  { immediate: true },
);

const updateName = (newName: string) => {
  localName.value = newName;

  if (!newName.trim()) {
    nameError.value = "Name cannot be empty";
    return;
  }

  // Check uniqueness against other nodes
  const exists = nodes.value.some(
    (n) => n.id !== props.node.id && (n.data?.label || n.id) === newName,
  );

  if (exists) {
    nameError.value = "Name already exists";
    return; // Do not update actual node data
  }

  nameError.value = "";
  // Check if really changed
  if (props.node.data.label !== newName) {
    const newData = { ...props.node.data, label: newName };
    emit("update:data", newData);
  }
};

const validateNameOnBlur = () => {
  // If invalid on blur, maybe revert?
  // For now, staying in error state is acceptable, or we revert to last valid.
  if (nameError.value) {
    // Revert to actual data
    localName.value = props.node.data.label;
    nameError.value = "";
  }
};

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
  const props = nodeType.value?.description.properties || [];
  return props.map((p) => {
    if (p.type === "options" && dynamicOptions.value[p.name]) {
      // Merge default options with dynamic ones
      const defaultOptions = p.options || [];
      const dynamic = dynamicOptions.value[p.name];
      // Avoid duplicates based on value
      const validDynamic = dynamic.filter(
        (d) => !defaultOptions.find((def) => def.value === d.value),
      );
      return {
        ...p,
        options: [...defaultOptions, ...validDynamic],
      };
    }
    return p;
  });
});

const updateValue = (key: string, value: any) => {
  const newData = { ...props.node.data, [key]: value };
  emit("update:data", newData);
};

// Dynamic Options Logic
const dynamicOptions = ref<Record<string, { name: string; value: string }[]>>(
  {},
);
const loadingOptions = ref<Record<string, boolean>>({});

const loadNodeOptions = async (propertyName: string) => {
  if (!nodeType.value || !nodeType.value.methods) return;

  const propDef = nodeType.value.description.properties.find(
    (p) => p.name === propertyName,
  );
  if (!propDef?.typeOptions?.loadOptionsMethod) return;

  const methodName = propDef.typeOptions.loadOptionsMethod;
  const method = nodeType.value.methods[methodName];

  if (!method) {
    console.warn(`Method ${methodName} not found in node definition`);
    return;
  }

  loadingOptions.value[propertyName] = true;

  try {
    // Mock execution context
    const context: any = {
      getNodeParameter: (paramName: string) => {
        return props.node.data[paramName] ?? propDef.default;
      },
      getCredential: async (credentialType: string) => {
        const credId = props.node.data.credentials?.[credentialType];
        if (!credId) return null;
        try {
          return await CredentialService.getDecryptedCredential(credId);
        } catch (e) {
          console.error("Failed to get credential", e);
          return null;
        }
      },
    };

    const result = await method.call(context);
    if (result && Array.isArray(result.results)) {
      dynamicOptions.value[propertyName] = result.results;
    }
  } catch (e) {
    console.error("Failed to load dynamic options", e);
  } finally {
    loadingOptions.value[propertyName] = false;
  }
};

// Watch for changes deeply in node data to trigger reload if dependencies change
watch(
  () => props.node.data,
  (newData, oldData) => {
    if (!nodeType.value) return;

    nodeType.value.description.properties.forEach((prop) => {
      const deps = prop.typeOptions?.loadOptionsDependsOn;
      if (!deps || !deps.length) return;

      const shouldReload = deps.some((dep) => {
        // dep is like "credentials.gemini_api" or "someProp"
        if (dep.startsWith("credentials.")) {
          const credType = dep.split(".")[1];
          return (
            newData.credentials?.[credType] !==
            oldData?.credentials?.[credType]
          );
        }
        return newData[dep] !== oldData?.[dep];
      });

      if (shouldReload) {
        loadNodeOptions(prop.name);
      }
    });
  },
  { deep: true },
);

// Initial load
watch(
  () => props.node?.id,
  () => {
    // Trigger load for all dynamic properties
    if (nodeType.value) {
      nodeType.value.description.properties.forEach((prop) => {
        if (prop.typeOptions?.loadOptionsMethod) {
          loadNodeOptions(prop.name);
        }
      });
    }
  },
  { immediate: true },
);

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

const shouldShowProperty = (prop: any) => {
  if (!prop.displayOptions) return true;

  const { show, hide } = prop.displayOptions;

  // Helper to check conditions
  const checkConditions = (conditions: any) => {
    return Object.entries(conditions).every(
      ([key, validValues]: [string, any]) => {
        const propertyDef = properties.value.find((p) => p.name === key);
        const currentValue = props.node.data[key] ?? propertyDef?.default;

        if (Array.isArray(validValues)) {
          return validValues.some((val) => {
            if (typeof val === "object" && val !== null) {
              // TODO: Handle DisplayCondition object if needed (complex conditions)
              // For now assuming simple values or simple object match?
              // n8n supports { propertyName: value } inside array?
              // The types say: Array<NodeParameterValue | DisplayCondition>
              // For simplicity, let's just handle simple values first as per request
              return false;
            }
            return val === currentValue;
          });
        }
        return validValues === currentValue;
      },
    );
  };

  let isVisible = true;

  if (show) {
    isVisible = isVisible && checkConditions(show);
  }

  if (hide) {
    isVisible = isVisible && !checkConditions(hide);
  }

  return isVisible;
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

    <!-- Node Name Edit -->
    <div class="space-y-1">
      <label class="text-sm font-medium">Name</label>
      <input
        type="text"
        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        :class="{ 'border-red-500 ring-red-500': nameError }"
        :value="localName"
        @input="(e) => updateName((e.target as HTMLInputElement).value)"
        @blur="validateNameOnBlur"
      />
      <p v-if="nameError" class="text-xs text-red-500">{{ nameError }}</p>
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
        v-show="shouldShowProperty(prop)"
      >
        <NodeInput
          :property="prop"
          :model-value="node.data[prop.name] ?? prop.default"
          :loading="loadingOptions[prop.name]"
          @update:model-value="(val: any) => updateValue(prop.name, val)"
          @refresh="loadNodeOptions(prop.name)"
        />
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
