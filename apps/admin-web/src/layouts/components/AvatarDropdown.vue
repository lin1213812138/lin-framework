<script setup lang="ts">
import { useUserStore } from '@/stores';

const userStore = useUserStore();

const dropdownOptions = [
  {
    label: '个人中心',
    key: 'profile',
  },
  {
    label: '退出登录',
    key: 'logout',
  },
];

function handleSelect(key: string) {
  if (key === 'logout') {
    userStore.logout();
    window.location.href = '/login';
  }
}
</script>

<template>
  <n-dropdown trigger="hover" :options="dropdownOptions" @select="handleSelect">
    <div class="flex items-center gap-8px cursor-pointer">
      <n-avatar circle size="small" />
      <span>{{ userStore.nickname || userStore.username }}</span>
    </div>
  </n-dropdown>
</template>
