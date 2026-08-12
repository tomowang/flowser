<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { browser } from "wxt/browser";
import Github from "@thesvg/vue/github";
import Chrome from "@thesvg/vue/chrome-web-store";
import Firefox from "@thesvg/vue/firefox-browser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supportedLocales, setLocale, getCurrentLocale } from "@/lib/i18n";
import {
  supportedThemes,
  setTheme,
  getCurrentTheme,
  type ThemeMode,
} from "@/lib/theme";

const GITHUB_REPO_URL = "https://github.com/tomowang/flowser";
const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/flowser/odmicdckhpklbjccdjceodllkalodedi";
const FIREFOX_STORE_URL =
  "https://addons.mozilla.org/en-US/firefox/addon/flowser-with-ai/";

const { t } = useI18n();
const currentLocale = ref(getCurrentLocale());
const currentTheme = ref<ThemeMode>(getCurrentTheme());
const appVersion = browser.runtime.getManifest().version;
const releaseUrl = `${GITHUB_REPO_URL}/releases/tag/v${appVersion}`;
const isFirefox = import.meta.env.FIREFOX;
const storeUrl = isFirefox ? FIREFOX_STORE_URL : CHROME_STORE_URL;
const storeIcon = isFirefox ? Firefox : Chrome;
const storeLabelKey = isFirefox
  ? "settings.firefoxAddons"
  : "settings.chromeWebStore";

watch(currentLocale, (newLocale) => {
  setLocale(newLocale);
});

watch(currentTheme, (newTheme) => {
  setTheme(newTheme);
});
</script>

<template>
  <div class="p-8">
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
        <a
          :href="releaseUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="w-fit text-sm text-muted-foreground hover:text-foreground"
        >
          {{ t("settings.version", { version: appVersion }) }}
        </a>
        <div class="flex items-center gap-3">
          <a
            :href="GITHUB_REPO_URL"
            target="_blank"
            rel="noopener noreferrer"
            :title="t('settings.github')"
            :aria-label="t('settings.github')"
            class="text-muted-foreground hover:text-foreground"
          >
            <Github class="h-5 w-5" />
          </a>
          <a
            :href="storeUrl"
            target="_blank"
            rel="noopener noreferrer"
            :title="t(storeLabelKey)"
            :aria-label="t(storeLabelKey)"
            class="text-muted-foreground hover:text-foreground"
          >
            <component :is="storeIcon" class="h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
