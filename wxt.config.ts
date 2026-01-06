import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-vue"],
  imports: false,
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  webExt: {
    chromiumArgs: ["--user-data-dir=./.wxt/chrome-data"],
  },
  manifest: {
    host_permissions: ["<all_urls>"],
    permissions: ["tabs", "activeTab"],
  },
});
