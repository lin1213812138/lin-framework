<script setup lang="ts">
import { useAppStore } from '@/stores';
import AvatarDropdown from './AvatarDropdown.vue';

const appStore = useAppStore();
</script>

<template>
  <n-layout-header bordered class="flex-between h-56px px-16px">
    <n-button quaternary @click="appStore.toggleSidebar">
      <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
          <line
            x1="3"
            y1="6"
            x2="21"
            y2="6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <line
            x1="3"
            y1="12"
            x2="21"
            y2="12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <line
            x1="3"
            y1="18"
            x2="21"
            y2="18"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </template>
    </n-button>

    <div class="flex items-center gap-12px">
      <AvatarDropdown />
    </div>
  </n-layout-header>
</template>
