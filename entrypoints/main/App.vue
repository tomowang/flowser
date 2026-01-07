<script setup lang="ts">
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import AppSidebar from "./components/AppSidebar.vue";
import { RouterView } from "vue-router";
import { Toaster } from "@/components/ui/sonner";
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header
        class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b px-4"
      >
        <div class="flex items-center gap-2">
          <SidebarTrigger class="-ml-1" />
        </div>
      </header>
      <div
        class="flex flex-1 flex-col gap-4 p-0 pt-0 overflow-hidden h-[calc(100vh-4rem)]"
      >
        <RouterView />
      </div>
    </SidebarInset>
  </SidebarProvider>
  <Toaster
    position="top-center"
    richColors
    closeButton
    closeButtonPosition="top-right"
  />
</template>
