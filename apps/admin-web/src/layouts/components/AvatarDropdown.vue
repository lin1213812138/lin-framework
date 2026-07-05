<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/stores';
import { getFileViewUrl } from '@/api/file';

const userStore = useUserStore();

const avatarSrc = computed(() => {
  if (userStore.avatar) {
    return getFileViewUrl(userStore.avatar);
  }
  return undefined;
});

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

async function handleSelect(key: string) {
  if (key === 'logout') {
    await userStore.logout();
    window.location.href = '/login';
  }
}
</script>

<template>
  <n-dropdown trigger="hover" :options="dropdownOptions" @select="handleSelect">
    <div class="flex items-center gap-8px cursor-pointer">
      <n-avatar
        circle
        size="small"
        :src="avatarSrc"
        fallback-src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 20c0-4 3.5-7 8-7s8 3 8 7'/%3E%3C/svg%3E"
      />
      <span>{{ userStore.nickname || userStore.username }}</span>
    </div>
  </n-dropdown>
</template>
