<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { SecurityService } from "@/lib/services/security-service";

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "unlocked"): void;
}>();

const { t } = useI18n();
const password = ref("");
const error = ref("");
const isLoading = ref(false);

const unlock = async () => {
  if (!password.value) {
    error.value = t("masterKey.passwordRequired");
    return;
  }

  try {
    isLoading.value = true;
    error.value = "";

    // Derive key
    const key = await SecurityService.deriveKey(password.value);

    // Validate key
    const isValid = await SecurityService.validateKey(key);
    if (!isValid) {
      error.value = t("masterKey.invalidPassword");
      return;
    }

    await SecurityService.saveToSession(key);

    emit("unlocked");
    emit("close");
    password.value = ""; // clear
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    error.value = t("masterKey.failedToDeriveKey") + " " + errorMessage;
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
  >
    <div class="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg">
      <h2 class="text-lg font-semibold mb-2">{{ t("masterKey.title") }}</h2>
      <p class="text-sm text-muted-foreground mb-4">
        {{ t("masterKey.description") }}
      </p>

      <div class="space-y-4">
        <div>
          <input
            v-model="password"
            type="password"
            :placeholder="t('masterKey.passwordPlaceholder')"
            class="w-full rounded-md border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            @keyup.enter="unlock"
          />
        </div>

        <div v-if="error" class="text-xs text-destructive">
          {{ error }}
        </div>

        <div class="flex justify-end gap-2">
          <button
            class="rounded px-3 py-1.5 text-xs font-semibold hover:bg-accent"
            @click="$emit('close')"
          >
            {{ t("common.cancel") }}
          </button>
          <button
            :disabled="isLoading"
            class="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            @click="unlock"
          >
            {{ isLoading ? t("masterKey.unlocking") : t("masterKey.unlock") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
