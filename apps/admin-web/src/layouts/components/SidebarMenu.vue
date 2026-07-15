<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { MenuOption } from 'naive-ui';
import { NIcon } from 'naive-ui';
import { useAppStore } from '@/stores';
import type { MenuTreeNode } from '@/api/menu';
import { getUserMenus } from '@/api/menu';
import { ICON_MAP } from '@/constants/icons';

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();

const menuOptions = ref<MenuOption[]>([]);
const loadingMenus = ref(true);

/** 图标映射（来自共享注册表） */
const iconMap = ICON_MAP;

function getIcon(name?: string) {
  const IconComponent = iconMap[name ?? ''];
  if (!IconComponent) {
    return undefined;
  }
  return () => h(NIcon, null, { default: () => h(IconComponent) });
}

/** 将 MenuTreeNode 递归转换为 n-menu 的 MenuOption */
function toMenuOptions(nodes: MenuTreeNode[]): MenuOption[] {
  return nodes.map((node) => {
    const option: MenuOption = {
      label: node.name,
      key: node.path || node._id,
    };

    if (node.icon) {
      option.icon = getIcon(node.icon);
    }

    if (node.children && node.children.length > 0) {
      option.children = toMenuOptions(node.children);
    }

    return option;
  });
}

/** 仪表盘菜单（始终显示在侧边栏首位，不依赖后端配置） */
const DASHBOARD_MENU: MenuOption = {
  label: '主控台',
  key: '/dashboard',
  icon: getIcon('dashboard'),
  children: [
    { label: '控制台', key: '/dashboard/console', icon: getIcon('console') },
    { label: '工作台', key: '/dashboard/workbench', icon: getIcon('workbench') },
    { label: '分析页', key: '/dashboard/analysis', icon: getIcon('analysis') },
  ],
};

/** 静态菜单（数据库无菜单数据时的后备方案） */
const STATIC_MENUS: MenuOption[] = [
  DASHBOARD_MENU,
  { label: '用户管理', key: '/system/user', icon: getIcon('user') },
  { label: '角色管理', key: '/system/role', icon: getIcon('role') },
  { label: '菜单管理', key: '/system/menu', icon: getIcon('menu') },
  { label: '权限管理', key: '/permissions', icon: getIcon('permission') },
  { label: '文件管理', key: '/files', icon: getIcon('file') },
];

async function loadMenus() {
  loadingMenus.value = true;
  try {
    const res = await getUserMenus();
    const tree = res.data.data;
    if (tree && tree.length > 0) {
      menuOptions.value = [DASHBOARD_MENU, ...toMenuOptions(tree)];
    } else {
      // 返回空数据时使用静态菜单
      menuOptions.value = STATIC_MENUS;
    }
  } catch {
    // 加载失败时使用静态菜单
    menuOptions.value = STATIC_MENUS;
  } finally {
    loadingMenus.value = false;
  }
}

function handleMenuSelect(key: string) {
  router.push(key);
}

// 根据当前路由高亮菜单
const activeKey = ref('');

function updateActiveKey() {
  activeKey.value = route.path;
}

onMounted(() => {
  loadMenus();
  updateActiveKey();
});

// 监听路由变化
router.afterEach(updateActiveKey);
</script>

<template>
  <n-menu
    :value="activeKey"
    :options="menuOptions"
    :collapsed="appStore.sidebarCollapsed"
    :collapsed-width="64"
    :collapsed-icon-size="22"
    @update:value="handleMenuSelect"
  />
</template>
