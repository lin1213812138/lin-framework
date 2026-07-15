<script setup lang="ts">
import { ref, provide } from 'vue';
import { useAppStore } from '@/stores';
import SidebarLogo from './components/SidebarLogo.vue';
import SidebarMenu from './components/SidebarMenu.vue';
import HeaderBar from './components/HeaderBar.vue';

const appStore = useAppStore();

/** 页面重新加载 key，递增触发 router-view 重新渲染 */
const componentKey = ref(0);
function reloadPage(): void {
  componentKey.value++;
}
provide('reloadPage', reloadPage);
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
        <router-view :key="componentKey" />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>
