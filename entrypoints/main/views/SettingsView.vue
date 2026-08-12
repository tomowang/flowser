<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { browser } from "wxt/browser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supportedLocales, setLocale, getCurrentLocale } from "@/lib/i18n";
import { supportedThemes, setTheme, getCurrentTheme, type ThemeMode } from "@/lib/theme";

const { t } = useI18n();
const currentLocale = ref(getCurrentLocale());
const currentTheme = ref<ThemeMode>(getCurrentTheme());
const appVersion = browser.runtime.getManifest().version;

watch(currentLocale, (newLocale) => {
  setLocale(newLocale);
});

watch(currentTheme, (newTheme) => {
  setTheme(newTheme);
});
</script>

<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold tracking-tight font-display mb-2">
      {{ t("settings.title") }}
    </h1>
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

      <div class="flex flex-col gap-2">
        <Label for="theme">{{ t("settings.theme") }}</Label>
        <p class="text-sm text-muted-foreground">
          {{ t("settings.themeDescription") }}
        </p>
        <Select v-model="currentTheme">
          <SelectTrigger class="w-[200px]">
            <SelectValue :placeholder="t('settings.theme')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="theme in supportedThemes"
              :key="theme.code"
              :value="theme.code"
            >
              {{ t(theme.labelKey) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-2">
        <Label>{{ t("settings.about") }}</Label>
        <p class="text-sm text-muted-foreground">
          {{ t("settings.version", { version: appVersion }) }}
        </p>
      </div>
    </div>
  </div>
</template>
