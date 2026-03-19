<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Workflow,
  Key,
  History,
  Settings,
  Database,
} from "lucide-vue-next";
import { RouterLink } from "vue-router";
import { computed } from "vue";

import logo from "@/assets/logo.svg";

const { t } = useI18n();

const { state } = useSidebar();

const items = computed(() => [
  {
    title: t("sidebar.workflows"),
    url: "/workflows",
    icon: Workflow,
  },
  {
    title: t("sidebar.credentials"),
    url: "/credentials",
    icon: Key,
  },
  {
    title: t("sidebar.executions"),
    url: "/executions",
    icon: History,
  },
  {
    title: t("sidebar.datatables"),
    url: "/datatables",
    icon: Database,
  },
]);
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <div
            class="flex items-center justify-between gap-2"
            :class="{
              'flex-row': state === 'expanded',
              'flex-col': state === 'collapsed',
            }"
          >
            <SidebarMenuButton size="lg" as-child class="md:h-8 md:p-0">
              <a href="#">
                <div class="aspect-square size-8 rounded-lg">
                  <img :src="logo" />
                </div>
                <div
                  v-if="state === 'expanded'"
                  class="grid flex-1 text-left text-sm leading-tight"
                >
                  <span class="truncate font-semibold">Flowser</span>
                </div>
              </a>
            </SidebarMenuButton>
            <SidebarTrigger />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>{{ t("sidebar.platform") }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in items" :key="item.title">
              <SidebarMenuButton as-child :tooltip="item.title">
                <RouterLink
                  :to="item.url"
                  active-class="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                >
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton as-child>
            <RouterLink
              to="/settings"
              active-class="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            >
              <Settings />
              <span>{{ t("sidebar.settings") }}</span>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
