# 仿 Chrome 标签页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a Chrome-like multi-tab navigation system for LIN Framework admin-web, supporting tab switching, closing, drag-reorder, pin/unpin, refresh, right-click context menu, KeepAlive caching, and localStorage persistence.

**Architecture:** Pinia store manages tab state (list, activeId, persistence). TabBar.vue renders Chrome-styled tabs with vuedraggable. TabContextMenu.vue provides right-click actions. Router afterEach auto-adds tabs. Layout wraps router-view with KeepAlive for page state caching.

**Tech Stack:** Vue 3 + TypeScript + Pinia + Naive UI + vuedraggable + @vicons/ionicons5 + UnoCSS

## Global Constraints

- TypeScript strict mode: no `any`, use `unknown` with type narrowing
- Prefer `interface` over `type` for object types
- Use `import type` for type-only imports
- All functions must have JSDoc/TSDoc comments
- Do NOT add redundant comments that restate obvious code behavior
- Route meta module augmentation in `routes.ts`
- Icons from `@vicons/ionicons5` only
- Commit messages in Chinese, format: `feat(web): <description>`

---

### Task 1: Tab Types Definition

**Files:**

- Create: `apps/admin-web/src/types/tabs.ts`

**Interfaces:**

- Produces: `Tab` interface, `PersistedTabs` type

- [ ] **Step 1: Create types/tabs.ts**

```typescript
// apps/admin-web/src/types/tabs.ts

/** 单个标签 */
export interface Tab {
  /** 唯一标识，使用路由 path */
  id: string;
  /** 标签标题，来自 route.meta.title */
  title: string;
  /** 路由 path */
  path: string;
  /** 路由 name，用于 KeepAlive include */
  name: string;
  /** 是否固定（不可关闭），route.meta.affix 作为初始值，用户可手动切换 */
  affix: boolean;
  /** 图标名，来自 route.meta.icon */
  icon?: string;
}

/** localStorage 持久化快照（只存重建所需字段） */
export interface PersistedTabs {
  tabs: Array<{ id: string; path: string; name: string }>;
  activeId: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-web/src/types/tabs.ts
git commit -m "feat(web): 新增 Tab 和 PersistedTabs 类型定义
```

---

### Task 2: Pinia Tabs Store

**Files:**

- Create: `apps/admin-web/src/stores/tabs.ts`

**Interfaces:**

- Consumes: `Tab`, `PersistedTabs` from `@/types/tabs`
- Produces: `useTabsStore()` with state, getters, actions

- [ ] **Step 1: Create stores/tabs.ts**

```typescript
// apps/admin-web/src/stores/tabs.ts
import { defineStore } from 'pinia';
import type { Tab, PersistedTabs } from '@/types/tabs';

const STORAGE_KEY = 'tab:visited';

interface TabsState {
  tabs: Tab[];
  activeId: string;
  /** 临时从缓存中驱逐的 name，用于刷新当前标签 */
  pendingRefresh: string | null;
}

export const useTabsStore = defineStore('tabs', {
  state: (): TabsState => ({
    tabs: [],
    activeId: '',
    pendingRefresh: null,
  }),

  getters: {
    /** 当前激活标签对象 */
    activeTab(state): Tab | undefined {
      return state.tabs.find((t) => t.id === state.activeId);
    },

    /** 传给 keep-alive include 的 name 列表，排除 pendingRefresh */
    cachedNames(state): string[] {
      return state.tabs.filter((t) => t.name && t.name !== state.pendingRefresh).map((t) => t.name);
    },

    /** 可关闭的标签 */
    closableTabs(state): Tab[] {
      return state.tabs.filter((t) => !t.affix);
    },

    /** 固定标签 */
    affixedTabs(state): Tab[] {
      return state.tabs.filter((t) => t.affix);
    },
  },

  actions: {
    /** 添加标签，已存在则激活 */
    addTab(tab: Tab): void {
      const existing = this.tabs.find((t) => t.id === tab.id);
      if (existing) {
        this.activateTab(existing.id);
        return;
      }
      this.tabs.push({ ...tab });
      this.activateTab(tab.id);
      this.persistTabs();
    },

    /** 激活标签 */
    activateTab(id: string): void {
      this.activeId = id;
    },

    /** 移除标签 */
    removeTab(id: string): void {
      const idx = this.tabs.findIndex((t) => t.id === id);
      if (idx === -1) return;

      const isActive = id === this.activeId;
      this.tabs.splice(idx, 1);

      if (isActive) {
        // 激活右侧相邻，否则左侧，否则第一个固定标签
        const next = this.tabs[idx] ?? this.tabs[idx - 1] ?? this.tabs[0];
        if (next) {
          this.activateTab(next.id);
        } else {
          this.activeId = '';
        }
      }
      this.persistTabs();
    },

    /** 切换固定状态 */
    togglePin(id: string): void {
      const tab = this.tabs.find((t) => t.id === id);
      if (!tab) return;
      tab.affix = !tab.affix;
      this.persistTabs();
    },

    /** vuedraggable 排序后更新列表 */
    reorderTabs(tabs: Tab[]): void {
      this.tabs = tabs;
      this.persistTabs();
    },

    /** 刷新标签 */
    refreshTab(id: string): void {
      const tab = this.tabs.find((t) => t.id === id);
      if (!tab) return;

      if (id !== this.activeId) {
        // 非当前标签：先跳转，触发重建
        this.activateTab(id);
        return;
      }

      // 当前标签：临时驱逐出 KeepAlive 缓存
      this.pendingRefresh = tab.name;
      import('vue').then(({ nextTick }) => {
        nextTick(() => {
          this.pendingRefresh = null;
        });
      });
    },

    /** 移除左侧所有可关闭标签 */
    removeLeft(id: string): void {
      const idx = this.tabs.findIndex((t) => t.id === id);
      if (idx <= 0) return;

      const removed = this.tabs.splice(0, idx);
      const removedActive = removed.some((t) => t.id === this.activeId);

      if (removedActive) {
        // 若移除的标签中包含当前激活，激活当前基准标签
        this.activateTab(id);
      }
      this.persistTabs();
    },

    /** 移除右侧所有可关闭标签 */
    removeRight(id: string): void {
      const idx = this.tabs.findIndex((t) => t.id === id);
      if (idx === -1 || idx === this.tabs.length - 1) return;

      const removed = this.tabs.splice(idx + 1);
      const removedActive = removed.some((t) => t.id === this.activeId);

      if (removedActive) {
        this.activateTab(id);
      }
      this.persistTabs();
    },

    /** 移除其他所有可关闭标签 */
    removeOthers(id: string): void {
      this.tabs = this.tabs.filter((t) => t.id === id || t.affix);
      this.activateTab(id);
      this.persistTabs();
    },

    /** 关闭所有可关闭标签，保留固定标签 */
    removeAll(): void {
      const affixed = this.tabs.filter((t) => t.affix);
      this.tabs = affixed;
      this.activeId = affixed[0]?.id ?? '';
      this.persistTabs();
    },

    /** 持久化到 localStorage */
    persistTabs(): void {
      const data: PersistedTabs = {
        tabs: this.tabs.map((t) => ({ id: t.id, path: t.path, name: t.name })),
        activeId: this.activeId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    /** 从 localStorage 恢复标签 */
    restoreTabs(): void {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      try {
        const data: PersistedTabs = JSON.parse(raw);
        // 恢复非固定标签
        data.tabs.forEach((t) => {
          // 仅恢复，不触发 persistTabs
          this.tabs.push({
            id: t.id,
            title: '',
            path: t.path,
            name: t.name,
            affix: false,
          });
        });
        this.activeId = data.activeId;
      } catch {
        // 解析失败，忽略
      }
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-web/src/stores/tabs.ts
git commit -m "feat(web): 实现标签页 Pinia Store 含持久化

- 标签增删切换、固定/取消固定、拖拽排序
- 批量关闭（左侧/右侧/其他/全部）
- 刷新标签（非当前先跳转，当前驱逐 KeepAlive 缓存）
- localStorage 持久化与恢复"
```

---

### Task 3: Export useTabsStore

**Files:**

- Modify: `apps/admin-web/src/stores/index.ts`

**Interfaces:**

- Consumes: `useTabsStore` from `@/stores/tabs`
- Produces: `useTabsStore` exported from `@/stores`

- [ ] **Step 1: Add export to stores/index.ts**

```typescript
// apps/admin-web/src/stores/index.ts
export { useUserStore } from './user';
export { useAppStore } from './app';
export { useTabsStore } from './tabs';
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-web/src/stores/index.ts
git commit -m "feat(web): 导出 useTabsStore"
```

---

### Task 4: Router afterEach Subscription

**Files:**

- Modify: `apps/admin-web/src/router/index.ts`

**Interfaces:**

- Consumes: `useTabsStore` from `@/stores/tabs`

- [ ] **Step 1: Add afterEach to router/index.ts**

```typescript
// apps/admin-web/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { useTabsStore } from '@/stores/tabs';

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title as string} - LIN Framework`;
  const token = localStorage.getItem('accessToken');
  if (to.name !== 'Login' && to.name !== 'Register' && !token) {
    next({ name: 'Login' });
  } else {
    next();
  }
});

router.afterEach((to) => {
  const tabsStore = useTabsStore();
  tabsStore.addTab({
    id: to.path,
    title: (to.meta.title as string) || to.name || '',
    path: to.path,
    name: (to.name as string) || '',
    affix: !!to.meta.affix,
    icon: to.meta.icon as string | undefined,
  });
});

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-web/src/router/index.ts
git commit -m "feat(web): 路由 afterEach 订阅自动添加标签页"
```

---

### Task 5: Routes Meta Extension

**Files:**

- Modify: `apps/admin-web/src/router/routes.ts`

- [ ] **Step 1: Add vue-router module augmentation and affix config**

```typescript
// apps/admin-web/src/router/routes.ts
import type { RouteRecordRaw } from 'vue-router';

// vue-router meta 类型扩展
declare module 'vue-router' {
  interface RouteMeta {
    title: string;
    permission?: string;
    /** 是否固定标签（不可关闭） */
    affix?: boolean;
    /** 标签图标 */
    icon?: string;
    /** 是否需要 KeepAlive 缓存 */
    keepAlive?: boolean;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/index.vue'),
    children: [
      {
        path: '',
        redirect: '/dashboard/console',
      },
      {
        path: 'dashboard',
        children: [
          {
            path: 'console',
            name: 'Console',
            component: () => import('@/views/dashboard/console/index.vue'),
            meta: { title: '控制台', affix: true, keepAlive: true },
          },
          {
            path: 'workbench',
            name: 'Workbench',
            component: () => import('@/views/dashboard/workbench/index.vue'),
            meta: { title: '工作台' },
          },
          {
            path: 'analysis',
            name: 'Analysis',
            component: () => import('@/views/dashboard/analysis/index.vue'),
            meta: { title: '分析页' },
          },
        ],
      },
      // ... 其余路由保持不变
      {
        path: 'users',
        name: 'User',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户管理', permission: 'user:read' },
      },
      {
        path: 'roles',
        name: 'Role',
        component: () => import('@/views/role/index.vue'),
        meta: { title: '角色管理', permission: 'role:read' },
      },
      {
        path: 'menus',
        name: 'Menu',
        component: () => import('@/views/menu/index.vue'),
        meta: { title: '菜单管理', permission: 'menu:read' },
      },
      {
        path: 'permissions',
        name: 'Permission',
        component: () => import('@/views/permission/index.vue'),
        meta: { title: '权限管理', permission: 'permission:read' },
      },
      {
        path: 'files',
        name: 'File',
        component: () => import('@/views/file/index.vue'),
        meta: { title: '文件管理', permission: 'file:read' },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/login/register.vue'),
    meta: { title: '注册' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404' },
  },
];

export default routes;
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-web/src/router/routes.ts
git commit -m "feat(web): 路由 meta 扩展 affix/icon/keepAlive，控制台设为固定标签"
```

---

### Task 6: TabBar Component

**Files:**

- Create: `apps/admin-web/src/layouts/components/TabBar.vue`

**Interfaces:**

- Consumes: `useTabsStore` from `@/stores/tabs`

- [ ] **Step 1: Create layouts/components/TabBar.vue**

```vue
<script setup lang="ts">
import { useTabsStore } from '@/stores/tabs';
import { useRouter } from 'vue-router';
import { computed, ref } from 'vue';
import VueDraggable from 'vuedraggable';
import TabContextMenu from './TabContextMenu.vue';
import type { Tab } from '@/types/tabs';

const tabsStore = useTabsStore();
const router = useRouter();

/** 右键菜单状态 */
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  targetId: '',
});

function handleTabClick(tab: Tab): void {
  router.push(tab.path);
}

function handleTabMiddleClick(tab: Tab): void {
  if (tab.affix) return;
  tabsStore.removeTab(tab.id);
}

function handleContextMenu(e: MouseEvent, tab: Tab): void {
  e.preventDefault();
  contextMenu.value = {
    show: true,
    x: e.clientX,
    y: e.clientY,
    targetId: tab.id,
  };
}

function closeContextMenu(): void {
  contextMenu.value.show = false;
}

function onDragEnd(): void {
  // vuedraggable 已通过 v-model 更新 tabs
  tabsStore.persistTabs();
}

/** 标签 CSS class */
function tabClasses(tab: Tab): Record<string, boolean> {
  return {
    'tab--active': tab.id === tabsStore.activeId,
    'tab--affix': tab.affix,
  };
}
</script>

<template>
  <div class="tab-bar" @click="closeContextMenu" @contextmenu.prevent="closeContextMenu">
    <VueDraggable
      v-model="tabsStore.tabs"
      group="tabs"
      ghost-class="tab--ghost"
      drag-class="tab--dragging"
      :animation="200"
      handle=".tab__drag-area"
      @end="onDragEnd"
      class="tab-bar__inner"
    >
      <template #item="{ element }: { element: Tab }">
        <div
          class="tab"
          :class="tabClasses(element)"
          @click="handleTabClick(element)"
          @mouseup.middle="handleTabMiddleClick(element)"
          @contextmenu="handleContextMenu($event, element)"
        >
          <div class="tab__drag-area" />
          <span v-if="element.affix" class="tab__pin">&#x1F4CC;</span>
          <span class="tab__title">{{ element.title }}</span>
          <button
            v-if="!element.affix"
            class="tab__close"
            @click.stop="tabsStore.removeTab(element.id)"
          >
            &#x2715;
          </button>
        </div>
      </template>
    </VueDraggable>
  </div>

  <TabContextMenu
    v-if="contextMenu.show"
    :show="contextMenu.show"
    :x="contextMenu.x"
    :y="contextMenu.y"
    :target-id="contextMenu.targetId"
    @close="closeContextMenu"
    @select="closeContextMenu"
  />
</template>

<style scoped>
.tab-bar {
  background: #dee1e6;
  height: 36px;
  display: flex;
  align-items: flex-end;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  border-bottom: none;
  user-select: none;
}
.tab-bar::-webkit-scrollbar {
  display: none;
}

.tab-bar__inner {
  display: flex;
  align-items: flex-end;
  height: 36px;
  padding: 0 4px;
  min-width: 100%;
}

.tab {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 72px;
  max-width: 240px;
  height: 34px;
  padding: 0 12px;
  background: #e8eaed;
  margin-right: -8px;
  clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
  cursor: pointer;
  position: relative;
  z-index: 0;
  font-size: 12px;
  color: #444;
  transition: background 0.15s;
}
.tab:hover {
  background: #f1f3f4;
}
.tab--active {
  background: #fff;
  z-index: 1;
  height: 36px;
  box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.08);
  color: #222;
}
.tab--active:hover {
  background: #fff;
}

.tab--affix {
  padding-left: 8px;
}

.tab__drag-area {
  position: absolute;
  inset: 0;
  cursor: grab;
}
.tab--dragging .tab__drag-area {
  cursor: grabbing;
}

.tab__pin {
  font-size: 12px;
  line-height: 1;
}

.tab__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.tab__close {
  opacity: 0;
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition:
    background 0.15s,
    opacity 0.15s;
  flex-shrink: 0;
}
.tab:hover .tab__close {
  opacity: 1;
}
.tab__close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.tab--ghost {
  opacity: 0.4;
  background: #ccc;
}
.tab--dragging {
  opacity: 0.8;
  z-index: 999;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-web/src/layouts/components/TabBar.vue
git commit -m "feat(web): 实现 Chrome 风格 TabBar 标签栏组件

- 梯形 clip-path 重叠效果，激活标签浮起
- vuedraggable 拖拽排序
- 中键关闭、关闭按钮 hover 显示
- 右键触发上下文菜单
- 固定标签显示 pin 图标，无关闭按钮"
```

---

### Task 7: TabContextMenu Component

**Files:**

- Create: `apps/admin-web/src/layouts/components/TabContextMenu.vue`

**Interfaces:**

- Consumes: `useTabsStore` from `@/stores/tabs`
- Props: `show: boolean`, `x: number`, `y: number`, `targetId: string`
- Emits: `close`, `select`

- [ ] **Step 1: Create layouts/components/TabContextMenu.vue**

```vue
<script setup lang="ts">
import { computed, h } from 'vue';
import { NIcon, NDropdown } from 'naive-ui';
import {
  ReloadOutline,
  PinOutline,
  PinSlashOutline,
  CloseOutline,
  ChevronBackOutline,
  ChevronForwardOutline,
  RemoveCircleOutline,
  CloseCircleOutline,
} from '@vicons/ionicons5';
import { useTabsStore } from '@/stores/tabs';

const props = defineProps<{
  show: boolean;
  x: number;
  y: number;
  targetId: string;
}>();

const emit = defineEmits<{
  close: [];
  select: [];
}>();

const tabsStore = useTabsStore();

const target = computed(() => tabsStore.tabs.find((t) => t.id === props.targetId));
const targetIsActive = computed(() => props.targetId === tabsStore.activeId);

const hasClosableLeft = computed(() => {
  const idx = tabsStore.tabs.findIndex((t) => t.id === props.targetId);
  if (idx <= 0) return false;
  return tabsStore.tabs.slice(0, idx).some((t) => !t.affix);
});

const hasClosableRight = computed(() => {
  const idx = tabsStore.tabs.findIndex((t) => t.id === props.targetId);
  if (idx === -1 || idx === tabsStore.tabs.length - 1) return false;
  return tabsStore.tabs.slice(idx + 1).some((t) => !t.affix);
});

const hasClosableOthers = computed(() => {
  return tabsStore.tabs.some((t) => t.id !== props.targetId && !t.affix);
});

function renderIcon(iconComponent: any) {
  return () => h(NIcon, null, { default: () => h(iconComponent) });
}

const menuOptions = computed(() => [
  {
    key: 'refresh',
    label: '刷新',
    icon: renderIcon(ReloadOutline),
  },
  {
    key: 'togglePin',
    label: target.value?.affix ? '取消固定' : '固定标签',
    icon: renderIcon(target.value?.affix ? PinSlashOutline : PinOutline),
  },
  {
    type: 'divider' as const,
  },
  {
    key: 'close',
    label: targetIsActive.value ? '关闭当前' : '关闭标签',
    disabled: target.value?.affix ?? false,
    icon: renderIcon(CloseOutline),
  },
  {
    key: 'closeLeft',
    label: '关闭左侧',
    disabled: !hasClosableLeft.value,
    icon: renderIcon(ChevronBackOutline),
  },
  {
    key: 'closeRight',
    label: '关闭右侧',
    disabled: !hasClosableRight.value,
    icon: renderIcon(ChevronForwardOutline),
  },
  {
    key: 'closeOthers',
    label: '关闭其他',
    disabled: !hasClosableOthers.value,
    icon: renderIcon(RemoveCircleOutline),
  },
  {
    key: 'closeAll',
    label: '关闭全部',
    icon: renderIcon(CloseCircleOutline),
  },
]);

function handleSelect(key: string): void {
  switch (key) {
    case 'refresh':
      tabsStore.refreshTab(props.targetId);
      break;
    case 'togglePin':
      tabsStore.togglePin(props.targetId);
      break;
    case 'close':
      tabsStore.removeTab(props.targetId);
      break;
    case 'closeLeft':
      tabsStore.removeLeft(props.targetId);
      break;
    case 'closeRight':
      tabsStore.removeRight(props.targetId);
      break;
    case 'closeOthers':
      tabsStore.removeOthers(props.targetId);
      break;
    case 'closeAll':
      tabsStore.removeAll();
      break;
  }
  emit('select');
}

function handleClickoutside(): void {
  emit('close');
}
</script>

<template>
  <NDropdown
    trigger="manual"
    :show="show"
    :x="x"
    :y="y"
    :options="menuOptions"
    @select="handleSelect"
    @clickoutside="handleClickoutside"
  />
</template>
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-web/src/layouts/components/TabContextMenu.vue
git commit -m "feat(web): 实现标签页右键菜单组件

- 刷新、固定/取消固定、关闭当前/标签、关闭左侧/右侧/其他/全部
- 菜单项图标（@vicons/ionicons5）
- 禁用逻辑（无可关闭时禁用对应项）
- 右键点击的非当前标签显示'关闭标签'，当前标签显示'关闭当前'"
```

---

### Task 8: Install vuedraggable Dependency

- [ ] **Step 1: Install vuedraggable**

```bash
cd apps/admin-web
pnpm add vuedraggable@next -D
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-web/package.json apps/admin-web/pnpm-lock.yaml
git commit -m "build(web): 添加 vuedraggable 依赖用于标签拖拽排序"
```

---

### Task 9: Layout Integration

**Files:**

- Modify: `apps/admin-web/src/layouts/index.vue`

**Interfaces:**

- Consumes: `useTabsStore` from `@/stores/tabs`, `TabBar` component

- [ ] **Step 1: Update layouts/index.vue**

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { useAppStore } from '@/stores';
import { useTabsStore } from '@/stores/tabs';
import SidebarLogo from './components/SidebarLogo.vue';
import SidebarMenu from './components/SidebarMenu.vue';
import HeaderBar from './components/HeaderBar.vue';
import TabBar from './components/TabBar.vue';

const appStore = useAppStore();
const tabsStore = useTabsStore();

onMounted(() => {
  tabsStore.restoreTabs();
});
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
      <TabBar />
      <n-layout-content class="p-24px">
        <router-view v-slot="{ Component }">
          <keep-alive :include="tabsStore.cachedNames">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-web/src/layouts/index.vue
git commit -m "feat(web): 布局集成 TabBar 和 KeepAlive 页面缓存

- TabBar 插入 HeaderBar 下方
- router-view 用 keep-alive 包裹，include 绑定 cachedNames
- onMounted 时恢复持久化标签"
```
