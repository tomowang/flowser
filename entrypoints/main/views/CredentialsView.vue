<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Trash2 } from "lucide-vue-next";
import { CredentialService } from "@/lib/services/credential-service";
import { SecurityService } from "@/lib/services/security-service";
import { ICredential } from "@/lib/types";
import { Registry } from "@/lib/nodes/registry";
import { computed } from "vue";
import MasterKeyModal from "@/components/editor/MasterKeyModal.vue";

const credentials = ref<Omit<ICredential, "encryptedData" | "iv">[]>([]);
const isMasterKeyModalOpen = ref(false);
const isAddDialogOpen = ref(false);

const availableCredentialTypes = computed(() => {
  const types = new Set<{ label: string; value: string }>();
  Registry.getAll().forEach((node) => {
    node.description.properties?.forEach((prop) => {
      if (prop.type === "credential" && prop.credentialType) {
        // Humanize the label if possible, or just use the type
        const label = prop.credentialType
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        types.add({ label, value: prop.credentialType });
      }
    });
  });
  // Convert Set to Array and filter duplicates by value
  const unique = new Map();
  types.forEach((t) => unique.set(t.value, t));

  // Default fallback if nothing found (e.g. initial setup)
  if (unique.size === 0) {
    unique.set("gemini_api", { label: "Gemini API", value: "gemini_api" });
    unique.set("openai_api", { label: "OpenAI API", value: "openai_api" });
  }

  return Array.from(unique.values());
});

const { t } = useI18n();

const formData = ref({
  name: "",
  type: "gemini_api",
  value: "",
});

const loadCredentials = async () => {
  try {
    credentials.value = await CredentialService.getCredentials();
  } catch (e) {
    console.error("Failed to load credentials", e);
  }
};

onMounted(async () => {
  // Check functionality availability
  const hasKey = SecurityService.hasMasterKey();
  if (!hasKey) {
    const restored = await SecurityService.restoreFromSession();
    if (!restored) {
      isMasterKeyModalOpen.value = true;
    } else {
      loadCredentials();
    }
  } else {
    loadCredentials();
  }
});

const onUnlocked = () => {
  loadCredentials();
};

const saveCredential = async () => {
  if (!formData.value.name || !formData.value.value) return;

  try {
    await CredentialService.saveCredential(
      formData.value.name,
      formData.value.type,
      formData.value.value,
    );
    isAddDialogOpen.value = false;
    formData.value = { name: "", type: "gemini_api", value: "" }; // Reset
    await loadCredentials();
  } catch (e) {
    console.error(e);
    // If error is due to missing key, prompt
    if (!SecurityService.hasMasterKey()) {
      isMasterKeyModalOpen.value = true;
    }
  }
};

const deleteCredential = async (id: string) => {
  if (confirm(t("credentials.deleteConfirm"))) {
    await CredentialService.deleteCredential(id);
    await loadCredentials();
  }
};
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold tracking-tight">
        {{ t("credentials.title") }}
      </h1>
      <Dialog v-model:open="isAddDialogOpen">
        <DialogTrigger as-child>
          <Button>
            <Plus class="mr-2 h-4 w-4" />
            {{ t("credentials.addCredential") }}
          </Button>
        </DialogTrigger>
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
    </div>

    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{{ t("common.name") }}</TableHead>
            <TableHead>{{ t("common.type") }}</TableHead>
            <TableHead>{{ t("credentials.createdAt") }}</TableHead>
            <TableHead class="text-right">{{ t("common.actions") }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="cred in credentials" :key="cred.id">
            <TableCell class="font-medium">{{ cred.name }}</TableCell>
            <TableCell>{{ cred.type }}</TableCell>
            <TableCell>{{
              new Date(cred.createdAt).toLocaleDateString()
            }}</TableCell>
            <TableCell class="text-right">
              <Button
                variant="ghost"
                size="icon"
                @click="deleteCredential(cred.id)"
              >
                <Trash2 class="h-4 w-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
          <TableRow v-if="credentials.length === 0">
            <TableCell colspan="4" class="h-24 text-center">
              {{ t("credentials.noCredentialsFound") }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <MasterKeyModal
      :is-open="isMasterKeyModalOpen"
      @close="isMasterKeyModalOpen = false"
      @unlocked="onUnlocked"
    />
  </div>
</template>
