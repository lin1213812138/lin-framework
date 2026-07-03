<script setup lang="ts">
import { useAppStore } from '@/stores';

const appStore = useAppStore();
</script>

<template>
  <div class="flex-center h-64px border-b border-#e5e5e5 text-20px font-bold whitespace-nowrap">
    <span v-if="!appStore.sidebarCollapsed">LIN Framework</span>
    <span v-else>LIN</span>
  </div>
</template>
