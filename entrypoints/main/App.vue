<script setup lang="ts">
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import AppSidebar from "./components/AppSidebar.vue";
import { RouterView } from "vue-router";
import { Toaster } from "@/components/ui/sonner";

const isDev = import.meta.env.DEV;
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
    rich-colors
    close-button
    close-button-position="top-right"
  />
  <div
    v-if="isDev"
    class="fixed right-0 top-0 z-50 flex items-center justify-center bg-gray-200 p-2 text-sm uppercase text-black sm:bg-red-200 md:bg-yellow-200 lg:bg-green-200 xl:bg-blue-200 2xl:bg-pink-200"
  >
    <span class="block sm:hidden">all</span>
    <span class="hidden sm:block md:hidden">sm</span>
    <span class="hidden md:block lg:hidden">md</span>
    <span class="hidden lg:block xl:hidden">lg</span>
    <span class="hidden xl:block 2xl:hidden">xl</span>
    <span class="hidden 2xl:block">2xl</span>
  </div>
</template>
