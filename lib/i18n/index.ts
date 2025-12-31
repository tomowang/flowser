import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";

const messages = {
  en,
  "zh-CN": zhCN,
};

export const supportedLocales = [
  { code: "en", name: "English" },
  { code: "zh-CN", name: "简体中文" },
];

function getBrowserLocale(): string {
  const browserLang = navigator.language;
  const supportedCodes = supportedLocales.map((l) => l.code);

  // Check for exact match
  if (supportedCodes.includes(browserLang)) {
    return browserLang;
  }

  // Check for base language match (e.g., "zh" matches "zh-CN")
  const baseLang = browserLang.split("-")[0];
  const match = supportedCodes.find((code) => code.startsWith(baseLang));
  return match || "en";
}

function getStoredLocale(): string | null {
  return localStorage.getItem("flowser-locale");
}

export const i18n = createI18n({
  legacy: false,
  locale: getStoredLocale() || getBrowserLocale(),
  fallbackLocale: "en",
  messages,
});

export function setLocale(locale: string) {
  i18n.global.locale.value = locale as "en" | "zh-CN";
  localStorage.setItem("flowser-locale", locale);
}

export function getCurrentLocale(): string {
  return i18n.global.locale.value;
}
