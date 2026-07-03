<script setup lang="ts">
import { useAppStore } from '@/stores';

const appStore = useAppStore();
</script>

<template>
  <n-menu :collapsed="appStore.sidebarCollapsed" :collapsed-width="64" :collapsed-icon-size="22" />
</template>
