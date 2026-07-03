<script setup lang="ts">
import { useAppStore } from '@/stores';
import SidebarLogo from './components/SidebarLogo.vue';
import SidebarMenu from './components/SidebarMenu.vue';
import HeaderBar from './components/HeaderBar.vue';

const appStore = useAppStore();
</script>

<template>
  <n-layout class="h-screen" has-sider>
    <n-layout-sider
      bordered
      show-trigger="arrow"
      v-model:collapsed="appStore.sidebarCollapsed"
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      class="h-screen"
    >
      <SidebarLogo />
      <SidebarMenu />
    </n-layout-sider>

    <n-layout>
      <HeaderBar />

      <n-layout-content class="p-24px">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>
