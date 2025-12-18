<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { CredentialService } from "@/lib/services/credential-service";
import { SecurityService } from "@/lib/services/security-service";
import { ICredential } from "@/lib/types";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "require-auth"): void;
}>();

const credentials = ref<Omit<ICredential, "encryptedData" | "iv">[]>([]);
const isAdding = ref(false);

const newCred = ref({
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

onMounted(() => {
  loadCredentials();
});

watch(
  () => props.isOpen,
  (v) => {
    if (v) loadCredentials();
  },
);

const save = async () => {
  if (!SecurityService.hasMasterKey()) {
    emit("require-auth");
    return;
  }

  if (!newCred.value.name || !newCred.value.value) return;

  await CredentialService.saveCredential(
    newCred.value.name,
    newCred.value.type,
    newCred.value.value,
  );
  newCred.value = { name: "", type: "gemini_api", value: "" };
  isAdding.value = false;
  await loadCredentials();
};

const remove = async (id: string) => {
  if (confirm("Delete credential?")) {
    await CredentialService.deleteCredential(id);
    await loadCredentials();
  }
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-40 flex items-center justify-center bg-background/50 backdrop-blur-sm"
  >
    <div
      class="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg max-h-[80vh] flex flex-col"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">Credentials</h2>
        <button
          @click="$emit('close')"
          class="text-muted-foreground hover:text-foreground"
        >
          X
        </button>
      </div>

      <div class="flex-1 overflow-y-auto min-h-[200px]">
        <div v-if="!isAdding" class="space-y-2">
          <div
            v-for="cred in credentials"
            :key="cred.id"
            class="flex items-center justify-between p-2 rounded border bg-accent/50"
          >
            <div>
              <div class="font-medium text-sm">{{ cred.name }}</div>
              <div class="text-xs text-muted-foreground">{{ cred.type }}</div>
            </div>
            <button
              @click="remove(cred.id)"
              class="text-destructive hover:bg-destructive/10 p-1 rounded"
            >
              <!-- trash icon placeholder -->
              Del
            </button>
          </div>
          <div
            v-if="credentials.length === 0"
            class="text-center text-sm text-muted-foreground py-4"
          >
            No credentials saved.
          </div>
        </div>

        <div v-else class="space-y-3 p-1">
          <input
            v-model="newCred.name"
            placeholder="Name (e.g. My Gemini Key)"
            class="w-full rounded border px-3 py-1.5 text-sm"
          />
          <select
            v-model="newCred.type"
            class="w-full rounded border px-3 py-1.5 text-sm"
          >
            <option value="gemini_api">Gemini API</option>
            <option value="openai_api">OpenAI API</option>
          </select>
          <input
            v-model="newCred.value"
            type="password"
            placeholder="API Key"
            class="w-full rounded border px-3 py-1.5 text-sm"
          />

          <div class="flex justify-end gap-2 mt-2">
            <button @click="isAdding = false" class="text-xs px-2 py-1">
              Cancel
            </button>
            <button
              @click="save"
              class="bg-primary text-primary-foreground text-xs px-3 py-1 rounded"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <div v-if="!isAdding" class="mt-4 pt-4 border-t">
        <button
          @click="isAdding = true"
          class="w-full rounded bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add New Credential
        </button>
      </div>
    </div>
  </div>
</template>
