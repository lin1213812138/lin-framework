<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NBreadcrumb, NBreadcrumbItem } from 'naive-ui';

interface BreadcrumbItem {
  title: string;
  name: string;
  isCurrent: boolean;
}

const route = useRoute();
const router = useRouter();

/** 面包屑：首页（仪表盘）为固定第一级，当前页面为第二级 */
const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [{ title: '仪表盘', name: 'Dashboard', isCurrent: false }];

  // 取当前子路由（跳过根路径 '/'）
  const currentRoute = route.matched.find((r) => r.path !== '/' && r.path !== '');
  if (currentRoute && currentRoute.name !== 'Dashboard') {
    items.push({
      title: (currentRoute.meta?.title as string) || String(currentRoute.name ?? ''),
      name: (currentRoute.name as string) || '',
      isCurrent: true,
    });
  }

  return items;
});

/** 点击非当前项跳转 */
function handleClick(item: BreadcrumbItem): void {
  if (!item.isCurrent && item.name) {
    router.push({ name: item.name });
  }
}
</script>

<template>
  <n-breadcrumb>
    <n-breadcrumb-item
      v-for="item in breadcrumbItems"
      :key="item.name"
      :clickable="!item.isCurrent"
      @click="handleClick(item)"
    >
      {{ item.title }}
    </n-breadcrumb-item>
  </n-breadcrumb>
</template>
