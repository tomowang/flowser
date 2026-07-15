export type ThemeMode = "system" | "light" | "dark";

export const supportedThemes: { code: ThemeMode; labelKey: string }[] = [
  { code: "system", labelKey: "settings.themeSystem" },
  { code: "light", labelKey: "settings.themeLight" },
  { code: "dark", labelKey: "settings.themeDark" },
];

const STORAGE_KEY = "flowser-theme";

const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

function getStoredTheme(): ThemeMode | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return isThemeMode(stored) ? stored : null;
}

let currentTheme: ThemeMode = getStoredTheme() || "system";

function resolveIsDark(mode: ThemeMode): boolean {
  return mode === "dark" || (mode === "system" && darkMediaQuery.matches);
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", resolveIsDark(mode));
}

darkMediaQuery.addEventListener("change", () => {
  if (currentTheme === "system") {
    applyTheme(currentTheme);
  }
});

export function initTheme() {
  applyTheme(currentTheme);
}

export function setTheme(mode: ThemeMode) {
  currentTheme = mode;
  localStorage.setItem(STORAGE_KEY, mode);
  applyTheme(mode);
}

export function getCurrentTheme(): ThemeMode {
  return currentTheme;
}
