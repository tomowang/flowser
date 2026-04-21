<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { type Node } from "@vue-flow/core";
import { Registry } from "@/lib/nodes/registry";
import { CredentialService } from "@/lib/services/credential-service";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-vue-next";
import CreateCredentialModal from "@/components/editor/CreateCredentialModal.vue";
import CredentialIcon from "@/components/editor/CredentialIcon.vue";
import { getCredentialType } from "@/lib/credentials";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  INodeCredentialDescription,
  INodeProperties,
  IExecuteFunctions,
} from "@/lib/types";
import "@vue-js-cron/light/dist/light.css";
import NodeInput from "./NodeInput.vue";

const { t, te } = useI18n();

const props = defineProps<{
  node: Node; // The selected node object from Vue Flow
}>();

const emit = defineEmits(["update:data"]);

// Credential options: keyed by credential type name
const credentialOptions = ref<Record<string, { name: string; value: string }[]>>(
  {},
);

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

const updateValue = (key: string, value: unknown) => {
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
    const context: Partial<IExecuteFunctions> = {
      getNodeParameter: (paramName: string) => {
        return (
          (props.node.data as Record<string, unknown>)[paramName] ??
          propDef.default
        );
      },
      getCredential: async (credentialType: string) => {
        const credId = (
          props.node.data.credentials as Record<string, string> | undefined
        )?.[credentialType];
        if (!credId) return null;
        try {
          return await CredentialService.getDecryptedCredential(credId);
        } catch (e) {
          console.error("Failed to get credential", e);
          return null;
        }
      },
    };

    const result = await method.call(context as IExecuteFunctions);
    if (
      result &&
      typeof result === "object" &&
      "results" in result &&
      Array.isArray(result.results)
    ) {
      dynamicOptions.value[propertyName] = result.results as {
        name: string;
        value: string;
      }[];
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
            (newData.credentials as Record<string, string> | undefined)?.[
              credType
            ] !==
            (oldData?.credentials as Record<string, string> | undefined)?.[
              credType
            ]
          );
        }
        return (
          (newData as Record<string, unknown>)[dep] !==
          (oldData as Record<string, unknown>)?.[dep]
        );
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
  const currentCredentials =
    (props.node.data.credentials as Record<string, string>) || {};
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
  return (
    (props.node.data.credentials as Record<string, string> | undefined)?.[
      credType
    ] || ""
  );
};

const shouldShowProperty = (prop: INodeProperties) => {
  if (!prop.displayOptions) return true;

  const { show, hide } = prop.displayOptions;

  // Helper to check conditions
  const checkConditions = (conditions: Record<string, unknown>) => {
    return Object.entries(conditions).every(([key, validValues]) => {
      const propertyDef = properties.value.find((p) => p.name === key);
      const currentValue =
        (props.node.data as Record<string, unknown>)[key] ??
        propertyDef?.default;

      if (Array.isArray(validValues)) {
        return (validValues as unknown[]).some((val) => {
          if (typeof val === "object" && val !== null) {
            // TODO: Handle DisplayCondition object if needed (complex conditions)
            // For now assuming simple values or simple object match?
            return false;
          }
          return val === currentValue;
        });
      }
      return validValues === currentValue;
    });
  };

  let isVisible = true;

  if (show) {
    isVisible = isVisible && checkConditions(show as Record<string, unknown>);
  }

  if (hide) {
    isVisible = isVisible && !checkConditions(hide as Record<string, unknown>);
  }

  return isVisible;
};
</script>

<template>
  <div v-if="node && nodeType" class="space-y-4">
    <div>
      <h3 class="font-medium text-lg">
        {{ te(`nodes.${nodeType.description.name}.displayName`) ? t(`nodes.${nodeType.description.name}.displayName`) : nodeType.description.displayName }}
      </h3>
      <p class="text-xs text-muted-foreground">
        {{ te(`nodes.${nodeType.description.name}.description`) ? t(`nodes.${nodeType.description.name}.description`) : nodeType.description.description }}
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
          te(`credentialTypes.${cred.name}.displayName`) ? t(`credentialTypes.${cred.name}.displayName`) : (cred.displayName || cred.name)
        }}</label>
        <div class="flex gap-2">
          <Select
            :model-value="getCredentialValue(cred.name)"
            @update:model-value="
              (val) => updateCredentialValue(cred.name, val as string)
            "
          >
            <SelectTrigger class="w-full">
              <SelectValue :placeholder="t('credentials.selectCredential')">
                <div v-if="getCredentialValue(cred.name)" class="flex items-center gap-2">
                  <CredentialIcon
                    :icon="getCredentialType(cred.name)?.icon"
                    class="w-4 h-4 shrink-0"
                  />
                  <span>{{ credentialOptions[cred.name]?.find(opt => opt.value === getCredentialValue(cred.name))?.name }}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <template v-if="credentialOptions[cred.name]?.length">
                <SelectItem
                  v-for="opt in credentialOptions[cred.name]"
                  :key="opt.value"
                  :value="opt.value"
                >
                  <div class="flex items-center gap-2">
                    <CredentialIcon
                      :icon="getCredentialType(cred.name)?.icon"
                      class="w-4 h-4 shrink-0"
                    />
                    <span>{{ opt.name }}</span>
                  </div>
                </SelectItem>
              </template>
              <SelectItem v-else value="no-credentials" disabled>
                {{ t('credentials.noCredentialsFound') }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            class="shrink-0"
            :title="t('credentials.createNew')"
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
        v-show="shouldShowProperty(prop)"
        :key="prop.name"
      >
        <NodeInput
          :property="prop"
          :node-type-name="nodeType.description.name"
          :model-value="
            (node.data as Record<string, unknown>)[prop.name] ?? prop.default
          "
          :loading="loadingOptions[prop.name]"
          @update:model-value="(val: unknown) => updateValue(prop.name, val)"
          @refresh="loadNodeOptions(prop.name)"
        />
      </div>
    </div>
  </div>
  <div v-else class="text-muted-foreground text-sm">
    {{ t('workflowEditor.selectNodeToEdit') }}
  </div>

  <CreateCredentialModal
    v-model:open="isCreateCredentialOpen"
    :default-type="credentialTypeForCreation"
    @created="onCredentialCreated"
  />
</template>
