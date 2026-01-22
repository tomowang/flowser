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
} from "@/components/ui/sidebar";
import {
  Workflow,
  Key,
  History,
  Settings,
  GalleryVerticalEnd,
  Database,
} from "lucide-vue-next";
import { RouterLink, useRoute } from "vue-router";
import { computed } from "vue";

import logo from "@/assets/logo.svg";

const { t } = useI18n();

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
          <SidebarMenuButton size="lg" as-child>
            <a href="#">
              <div class="aspect-square size-8 rounded-lg">
                <img :src="logo" />
              </div>
              <div class="flex flex-col gap-0.5 leading-none">
                <span class="font-semibold">Flowser</span>
                <span class="">v0.1.0</span>
              </div>
            </a>
          </SidebarMenuButton>
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
