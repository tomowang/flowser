<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supportedLocales, setLocale, getCurrentLocale } from "@/lib/i18n";

const { t } = useI18n();
const currentLocale = ref(getCurrentLocale());

watch(currentLocale, (newLocale) => {
  setLocale(newLocale);
});
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-2">{{ t("settings.title") }}</h1>
    <p class="text-muted-foreground mb-6">{{ t("settings.description") }}</p>

    <div class="space-y-6">
      <div class="flex flex-col gap-2">
        <Label for="language">{{ t("settings.language") }}</Label>
        <p class="text-sm text-muted-foreground">
          {{ t("settings.languageDescription") }}
        </p>
        <Select v-model="currentLocale">
          <SelectTrigger class="w-[200px]">
            <SelectValue :placeholder="t('settings.language')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="locale in supportedLocales"
              :key="locale.code"
              :value="locale.code"
            >
              {{ locale.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</template>
