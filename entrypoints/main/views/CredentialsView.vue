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
import { Plus, Trash2 } from "lucide-vue-next";
import { CredentialService } from "@/lib/services/credential-service";
import { SecurityService } from "@/lib/services/security-service";
import { ICredential } from "@/lib/types";
import { computed } from "vue";
import MasterKeyModal from "@/components/editor/MasterKeyModal.vue";
import CreateCredentialModal from "@/components/editor/CreateCredentialModal.vue";

const credentials = ref<Omit<ICredential, "encryptedData" | "iv">[]>([]);
const isMasterKeyModalOpen = ref(false);
const isAddDialogOpen = ref(false);

const { t } = useI18n();


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
      <Button @click="isAddDialogOpen = true">
            <Plus class="mr-2 h-4 w-4" />
            {{ t("credentials.addCredential") }}
      </Button>

      <CreateCredentialModal
        v-model:open="isAddDialogOpen"
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
