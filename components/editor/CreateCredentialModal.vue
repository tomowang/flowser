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
import { Registry } from "@/lib/nodes/registry";
import MasterKeyModal from "@/components/editor/MasterKeyModal.vue";

const props = defineProps<{
  open: boolean;
  defaultType?: string;
}>();

const emit = defineEmits(["update:open", "created"]);

const { t } = useI18n();
const isMasterKeyModalOpen = ref(false);

const formData = ref({
  name: "",
  type: "gemini_api",
  value: "",
});

const availableCredentialTypes = computed(() => {
  const types = new Set<{ label: string; value: string }>();
  Registry.getAll().forEach((node) => {
    node.description.properties?.forEach((prop) => {
      if (prop.type === "credential" && prop.credentialType) {
        const label = prop.credentialType
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        types.add({ label, value: prop.credentialType });
      }
    });
  });
  
  const unique = new Map();
  types.forEach((t) => unique.set(t.value, t));

  if (unique.size === 0) {
    unique.set("gemini_api", { label: "Gemini API", value: "gemini_api" });
    unique.set("openai_api", { label: "OpenAI API", value: "openai_api" });
  }

  return Array.from(unique.values());
});

watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      if (props.defaultType) {
        formData.value.type = props.defaultType;
      }
    } else {
       // Reset form when closed? maybe not needed if parent handles it
    }
  }
);

watch(
    () => props.defaultType,
    (newVal) => {
       if (newVal) formData.value.type = newVal;
    }
);


const saveCredential = async () => {
  if (!formData.value.name || !formData.value.value) return;

  try {
    const credId = await CredentialService.saveCredential(
      formData.value.name,
      formData.value.type,
      formData.value.value,
    );
    emit("created", credId);
    emit("update:open", false);
    formData.value = { name: "", type: props.defaultType || "gemini_api", value: "" }; // Reset
  } catch (e) {
    console.error(e);
    if (!SecurityService.hasMasterKey()) {
      isMasterKeyModalOpen.value = true;
    }
  }
};

const onUnlocked = () => {
  // Retry save or just let user click again? 
  // For better UX, we could retry save.
  saveCredential();
};
</script>

<template>
  <Dialog :open="open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ t("credentials.addCredentialTitle") }}</DialogTitle>
        <DialogDescription>
          {{ t("credentials.addCredentialDescription") }}
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" class="text-right">{{
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
          <Label htmlFor="type" class="text-right">{{
            t("common.type")
          }}</Label>
          <div class="col-span-3">
            <Select v-model="formData.type">
              <SelectTrigger>
                <SelectValue :placeholder="t('credentials.selectType')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="type in availableCredentialTypes"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="value" class="text-right">{{
            t("common.value")
          }}</Label>
          <Input
            id="value"
            v-model="formData.value"
            type="password"
            class="col-span-3"
            :placeholder="t('credentials.valuePlaceholder')"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" @click="saveCredential">{{
          t("common.saveChanges")
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
