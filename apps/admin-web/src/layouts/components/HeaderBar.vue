<script setup lang="ts">
import { inject } from 'vue';
import { useFullscreen } from '@vueuse/core';
import { useAppStore } from '@/stores';
import AvatarDropdown from './AvatarDropdown.vue';
import BreadcrumbBar from './BreadcrumbBar.vue';

const appStore = useAppStore();
const { isFullscreen, toggle } = useFullscreen();
const reloadPage = inject<() => void>('reloadPage');
</script>

<template>
  <n-layout-header bordered class="flex-between h-56px px-16px">
    <div class="flex items-center gap-8px">
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

      <BreadcrumbBar />

      <!-- 刷新按钮 -->
      <n-button quaternary @click="reloadPage?.()">
        <template #icon>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
            <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </template>
      </n-button>

      <!-- 全屏切换按钮 -->
      <n-button quaternary @click="toggle">
        <template #icon>
          <svg
            v-if="isFullscreen"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M8 3v3a2 2 0 0 1-2 2H3" />
            <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
            <path d="M3 16h3a2 2 0 0 1 2 2v3" />
            <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </template>
      </n-button>
    </div>

    <div class="flex items-center gap-4px">
      <AvatarDropdown />
    </div>
  </n-layout-header>
</template>
