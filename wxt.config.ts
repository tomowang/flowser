import { createRequire } from "node:module";
import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

const require = createRequire(import.meta.url);

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-vue"],
  imports: false,
  vite: (env) => ({
    build: {
      target: env.browser === "firefox" ? "firefox121" : "chrome120",
      minify: false,
    },
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        // The UMD bundle includes a legacy core-js iframe fallback.
        vuedraggable: require.resolve("vuedraggable/src/vuedraggable.js"),
      },
      dedupe: ["@codemirror/state", "@codemirror/view"],
    },
  }),
  webExt: {
    chromiumArgs: ["--user-data-dir=./.wxt/chrome-data"],
  },
  manifest: {
    host_permissions: ["<all_urls>"],
    permissions: [
      "storage",
      "tabs",
      "windows",
      "activeTab",
      "tabGroups",
      "alarms",
      "scripting",
      "webRequest",
    ],
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
    },
    web_accessible_resources: [
      {
        resources: ["assets/*.wasm"],
        matches: ["<all_urls>"],
      },
    ],
    browser_specific_settings: {
      gecko: {
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
  },
});
