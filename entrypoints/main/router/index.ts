import { createRouter, createWebHashHistory } from "vue-router";
import WorkflowsView from "../views/WorkflowsView.vue";
import WorkflowEditorView from "../views/WorkflowEditorView.vue";
import CredentialsView from "../views/CredentialsView.vue";
import ExecutionsView from "../views/ExecutionsView.vue";
import SettingsView from "../views/SettingsView.vue";

const routes = [
  { path: "/", redirect: "/workflows" },
  { path: "/workflows", component: WorkflowsView },
  { path: "/workflows/:id", component: WorkflowEditorView },
  { path: "/credentials", component: CredentialsView },
  { path: "/executions", component: ExecutionsView },
  { path: "/settings", component: SettingsView },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
