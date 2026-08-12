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

import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit } from "@lucide/vue";
import { CredentialService } from "@/lib/services/credential-service";
import { SecurityService } from "@/lib/services/security-service";
import { ICredential } from "@/lib/types";
import MasterKeyModal from "@/components/editor/MasterKeyModal.vue";
import CreateCredentialModal from "@/components/editor/CreateCredentialModal.vue";
import CredentialIcon from "@/components/editor/CredentialIcon.vue";
import { getCredentialType } from "@/lib/credentials";
import { useEntityI18n } from "@/lib/composables/useEntityI18n";

const credentials = ref<Omit<ICredential, "encryptedData" | "iv">[]>([]);
const isMasterKeyModalOpen = ref(false);
const isAddDialogOpen = ref(false);
const editingCredentialId = ref<string | undefined>(undefined);

const { t } = useI18n();
const credI18n = useEntityI18n("credentialTypes");

const loadCredentials = async () => {
  try {
    credentials.value = await CredentialService.getCredentials();
  } catch {
    console.error("Failed to load credentials");
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

const deleteCredential = async (id: string) => {
  if (confirm(t("credentials.deleteConfirm"))) {
    await CredentialService.deleteCredential(id);
    await loadCredentials();
  }
};

const editCredential = (id: string) => {
  editingCredentialId.value = id;
  isAddDialogOpen.value = true;
};

const openAddDialog = () => {
  editingCredentialId.value = undefined;
  isAddDialogOpen.value = true;
};
</script>

<template>
  <div class="p-8">
    <div class="flex items-start justify-between mb-8">
      <h1 class="text-3xl font-bold tracking-tight font-display">
        {{ t("credentials.title") }}
      </h1>
      <Button @click="openAddDialog">
        <Plus class="mr-2 h-4 w-4" />
        <span class="h-4 leading-4">{{ t("credentials.addCredential") }}</span>
      </Button>

      <CreateCredentialModal
        v-model:open="isAddDialogOpen"
        :credential-id="editingCredentialId"
        @created="loadCredentials"
      />
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
            <TableCell class="font-medium">{{
              cred.name === getCredentialType(cred.type)?.displayName
                ? credI18n.label(cred.type, cred.name)
                : cred.name
            }}</TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <CredentialIcon
                  :icon="getCredentialType(cred.type)?.icon"
                  class="w-4 h-4 shrink-0"
                />
                <span>{{
                  credI18n.label(
                    getCredentialType(cred.type)?.name || '',
                    getCredentialType(cred.type)?.displayName || ''
                  )
                }}</span>
              </div>
            </TableCell>
            <TableCell class="font-mono text-xs">{{
              new Date(cred.createdAt).toLocaleDateString()
            }}</TableCell>
            <TableCell class="text-right">
              <Button
                variant="ghost"
                size="icon"
                @click="editCredential(cred.id)"
              >
                <Edit class="h-4 w-4" />
              </Button>
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
