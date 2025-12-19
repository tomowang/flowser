<script setup lang="ts">
import { ref } from "vue";
import { SecurityService } from "@/lib/services/security-service";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "unlocked"): void;
}>();

const password = ref("");
const error = ref("");
const isLoading = ref(false);

const unlock = async () => {
  if (!password.value) {
    error.value = "Password is required";
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
      error.value = "Invalid Master Password";
      return;
    }

    await SecurityService.saveToSession(key);

    emit("unlocked");
    emit("close");
    password.value = ""; // clear
  } catch (e: any) {
    error.value = "Failed to derive key: " + e.message;
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
      <h2 class="text-lg font-semibold mb-2">Security Check</h2>
      <p class="text-sm text-muted-foreground mb-4">
        Enter your Master Password to access secure credentials.
      </p>

      <div class="space-y-4">
        <div>
          <input
            v-model="password"
            type="password"
            placeholder="Master Password"
            class="w-full rounded-md border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            @keyup.enter="unlock"
          />
        </div>

        <div v-if="error" class="text-xs text-destructive">
          {{ error }}
        </div>

        <div class="flex justify-end gap-2">
          <button
            @click="$emit('close')"
            class="rounded px-3 py-1.5 text-xs font-semibold hover:bg-accent"
          >
            Cancel
          </button>
          <button
            @click="unlock"
            :disabled="isLoading"
            class="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {{ isLoading ? "Unlocking..." : "Unlock" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
