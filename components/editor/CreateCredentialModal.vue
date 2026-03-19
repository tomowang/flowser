<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CredentialService } from "@/lib/services/credential-service";
import { SecurityService } from "@/lib/services/security-service";
import { getAllCredentialTypes, getCredentialType } from "@/lib/credentials";
import MasterKeyModal from "@/components/editor/MasterKeyModal.vue";
import CredentialIcon from "@/components/editor/CredentialIcon.vue";
import type { INodeProperties } from "@/lib/types";

const props = defineProps<{
  open: boolean;
  defaultType?: string;
  credentialId?: string;
}>();

const emit = defineEmits(["update:open", "created"]);

const { t } = useI18n();
const isMasterKeyModalOpen = ref(false);

const formData = ref<{
  name: string;
  type: string;
  values: Record<string, string>;
}>({
  name: "",
  type: "gemini_api",
  values: {},
});

const isEditMode = computed(() => !!props.credentialId);

const loadCredential = async () => {
  if (!props.credentialId) return;

  isLoading.value = true;
  try {
    const cred = await CredentialService.getCredential(props.credentialId);
    if (cred) {
      const values = await CredentialService.getDecryptedCredential(
        props.credentialId,
      );
      formData.value = {
        name: cred.name,
        type: cred.type,
        values: (values as Record<string, string>) || {},
      };
    }
  } catch (e) {
    console.error("Failed to load credential", e);
  } finally {
    // Ensure we don't clear values due to type change
    setTimeout(() => {
      isLoading.value = false;
    }, 100);
  }
};

// Get all registered credential types
const availableCredentialTypes = computed(() => {
  return getAllCredentialTypes().map((ct) => ({
    label: ct.displayName,
    value: ct.name,
    icon: ct.icon,
  }));
});

// Get properties for current credential type
const currentCredentialProperties = computed<INodeProperties[]>(() => {
  const credType = getCredentialType(formData.value.type);
  return credType?.properties || [];
});

const populateDefaults = () => {
  const credType = getCredentialType(formData.value.type);
  const defaults: Record<string, string> = {};
  credType?.properties.forEach((p) => {
    if (p.default !== undefined) {
      defaults[p.name] = String(p.default);
    }
  });
  formData.value.values = defaults;
};

watch(
  () => props.open,
  async (newVal) => {
    if (newVal) {
      if (props.credentialId) {
        await loadCredential();
      } else {
        if (props.defaultType) {
          formData.value.type = props.defaultType;
        }
        // Set default name to credential type's displayName
        const credType = getCredentialType(formData.value.type);
        formData.value.name = credType?.displayName || "";
        // Reset values when opening
        populateDefaults();
      }
    }
  },
);

watch(
  () => props.defaultType,
  (newVal) => {
    if (newVal) formData.value.type = newVal;
  },
);

const isLoading = ref(false);

// Reset values when credential type changes
watch(
  () => formData.value.type,
  () => {
    if (!isLoading.value) {
      populateDefaults();
    }
  },
);

const saveCredential = async () => {
  if (!formData.value.name) return;

  // Check required properties
  const hasRequiredValues = currentCredentialProperties.value
    .filter((p) => p.required)
    .every((p) => formData.value.values[p.name]);

  if (!hasRequiredValues) return;

  try {
    if (props.credentialId) {
      await CredentialService.updateCredential(
        props.credentialId,
        formData.value.name,
        formData.value.type,
        formData.value.values,
      );
      emit("created", props.credentialId);
    } else {
      const credId = await CredentialService.saveCredential(
        formData.value.name,
        formData.value.type,
        formData.value.values,
      );
      emit("created", credId);
    }
    emit("update:open", false);
    formData.value = {
      name: "",
      type: props.defaultType || "gemini_api",
      values: {},
    };
  } catch (e) {
    console.error(e);
    if (!SecurityService.hasMasterKey()) {
      isMasterKeyModalOpen.value = true;
    }
  }
};

const onUnlocked = () => {
  saveCredential();
};
</script>

<template>
  <Dialog :open="open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{
          isEditMode
            ? t("credentials.editCredentialTitle", "Edit Credential")
            : t("credentials.addCredentialTitle")
        }}</DialogTitle>
        <DialogDescription>
          {{
            isEditMode
              ? t(
                  "credentials.editCredentialDescription",
                  "Modify the credential details below.",
                )
              : t("credentials.addCredentialDescription")
          }}
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label html-for="name" class="text-right">{{
            t("common.name")
          }}</Label>
          <Input
            id="name"
            v-model="formData.name"
            class="col-span-3"
            :placeholder="t('credentials.namePlaceholder')"
          />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label html-for="type" class="text-right">{{
            t("common.type")
          }}</Label>
          <div class="col-span-3">
            <Select v-model="formData.type">
              <SelectTrigger>
                <SelectValue :placeholder="t('credentials.selectType')">
                  <div v-if="formData.type" class="flex items-center gap-2">
                    <CredentialIcon
                      :icon="availableCredentialTypes.find(t => t.value === formData.type)?.icon"
                      class="w-4 h-4 shrink-0"
                    />
                    <span>{{ availableCredentialTypes.find(t => t.value === formData.type)?.label }}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="type in availableCredentialTypes"
                  :key="type.value"
                  :value="type.value"
                >
                  <div class="flex items-center gap-2">
                    <CredentialIcon
                      :icon="type.icon"
                      class="w-4 h-4 shrink-0"
                    />
                    <span>{{ type.label }}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <!-- Dynamic properties based on credential type -->
        <div
          v-for="prop in currentCredentialProperties"
          :key="prop.name"
          class="grid grid-cols-4 items-center gap-4"
        >
          <Label :html-for="prop.name" class="text-right">{{
            prop.displayName
          }}</Label>
          <Input
            :id="prop.name"
            v-model="formData.values[prop.name]"
            :type="prop.type === 'password' ? 'password' : 'text'"
            class="col-span-3"
            :placeholder="prop.description || prop.displayName"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" @click="saveCredential">{{
          isEditMode ? t("common.save", "Save") : t("credentials.addCredential")
        }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <MasterKeyModal
    :is-open="isMasterKeyModalOpen"
    @close="isMasterKeyModalOpen = false"
    @unlocked="onUnlocked"
  />
</template>
