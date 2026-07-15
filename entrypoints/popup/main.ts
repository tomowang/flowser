import { createApp } from "vue";
import "@/assets/style.css";
import "../../lib/nodes/register";
import "vue-sonner/style.css";
import App from "./App.vue";
import { i18n } from "@/lib/i18n";
import { initTheme } from "@/lib/theme";

initTheme();

const app = createApp(App);
app.use(i18n);
app.mount("#app");
