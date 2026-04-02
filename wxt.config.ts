import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-vue"],
  imports: false,
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ["@codemirror/state", "@codemirror/view"],
    },
  }),
  webExt: {
    chromiumArgs: ["--user-data-dir=./.wxt/chrome-data"],
  },
  manifest: {
    host_permissions: ["<all_urls>"],
    permissions: ["storage", "tabs", "activeTab", "tabGroups", "alarms"],
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
    },
    web_accessible_resources: [
      {
        resources: ["assets/*.wasm"],
        matches: ["<all_urls>"],
      },
    ],
  },
});
