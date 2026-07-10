# 仿 Chrome 标签页组件 — 设计文档

## 概述

在 LIN Framework 前端 admin-web 中实现仿 Chrome 浏览器的多标签页导航系统。用户通过左侧菜单点击打开页面，页面以标签形式展示在内容区顶部，支持切换、关闭、拖拽排序、固定、刷新、持久化等交互。

## 技术栈

- **框架**: Vue 3 + TypeScript
- **UI 库**: Naive UI（N Dropdown 实现右键菜单）
- **状态管理**: Pinia
- **路由**: Vue Router
- **CSS**: UnoCSS + 自定义样式
- **拖拽**: vuedraggable (sortablejs)
- **图标**: @vicons/ionicons5

## 模块全景

```
apps/admin-web/src/
├── types/
│   └── tabs.ts               # Tab 类型定义
├── stores/
│   └── tabs.ts               # 标签页状态管理（Pinia）
├── layouts/
│   ├── index.vue             # 主布局（集成 TabBar + KeepAlive）
│   └── components/
│       ├── TabBar.vue        # Chrome 风格标签栏
│       └── TabContextMenu.vue # 右键菜单
├── router/
│   ├── index.ts              # 新增 afterEach 订阅
│   └── routes.ts             # meta 扩展（affix / icon / keepAlive）
└── stores/
    └── index.ts              # 导出 useTabsStore
```

## 数据流

```
路由变更 → router.afterEach
              ↓
         tabs store
         ├─ 新路由 → addTab()
         ├─ 已存在 → activateTab()
         └─ 固定标签来自 route.meta.affix
              ↓
         localStorage 持久化（每次变更后自动写入）
              ↓
         TabBar.vue 渲染标签列表
         ├─ 点击标签 → router.push()
         ├─ 关闭按钮 → store.removeTab()
         ├─ 中键关闭 → store.removeTab()
         ├─ 拖拽排序 → store.reorderTabs()  [vuedraggable]
         └─ 右键菜单 → TabContextMenu.vue
              ↓
         Layout 中的 <keep-alive :include="cachedNames">
              ↓
         <router-view /> 渲染缓存页面
```

## 类型定义

### `types/tabs.ts`

```typescript
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

## 状态管理

### `stores/tabs.ts`

#### State

| 字段       | 类型     | 说明                       |
| ---------- | -------- | -------------------------- |
| `tabs`     | `Tab[]`  | 标签列表，固定标签排在左侧 |
| `activeId` | `string` | 当前激活标签的 id          |

#### Getters

| Getter         | 说明                                              |
| -------------- | ------------------------------------------------- |
| `activeTab`    | 根据 activeId 查找当前标签对象                    |
| `cachedNames`  | tabs 中所有有效的 name[]，传给 keep-alive include |
| `closableTabs` | 可关闭的标签列表（!affix）                        |
| `affixedTabs`  | 固定标签列表（affix）                             |

#### Actions

| Action              | 触发时机                 | 行为                                                                |
| ------------------- | ------------------------ | ------------------------------------------------------------------- |
| `addTab(tab)`       | `router.afterEach`       | 已存在则 activateTab()，不存在则 push + persistTabs()               |
| `removeTab(id)`     | 关闭按钮 / 右键菜单      | 移除标签，若关闭的是当前标签则激活相邻标签                          |
| `activateTab(id)`   | 点击标签                 | 更新 activeId + router.push(path)                                   |
| `reorderTabs(list)` | 拖拽结束                 | 接收 vuedraggable 排序后的完整列表替换 tabs                         |
| `togglePin(id)`     | 右键菜单                 | 切换标签的 affix 状态                                               |
| `refreshTab(id)`    | 右键菜单                 | 若为非当前标签则先跳转；若为当前标签则从 KeepAlive 缓存中驱逐后重建 |
| `removeLeft(id)`    | 右键菜单                 | 移除指定标签左侧的所有可关闭标签                                    |
| `removeRight(id)`   | 右键菜单                 | 移除指定标签右侧的所有可关闭标签                                    |
| `removeOthers(id)`  | 右键菜单                 | 移除除指定标签外的所有可关闭标签                                    |
| `removeAll()`       | 右键菜单                 | 移除所有可关闭标签，仅保留固定标签                                  |
| `persistTabs()`     | 每次 tabs 变更后自动触发 | 序列化到 localStorage                                               |
| `restoreTabs()`     | layout onMounted         | 从 localStorage 反序列化并过滤无效路由后恢复                        |

#### 持久化策略

- 存储键: `'tab:visited'`
- 存储值: `{ tabs: [{ id, path, name }], activeId }`
- 固定标签不持久化（从路由 meta 重建）
- 恢复时过滤掉已经不存在的路由
- 应用启动后 restoreTabs() + 合并固定标签

#### removeTab 激活策略

```
关闭标签 X 时:
  1. 从列表中移除 X
  2. 如果 X 不是当前激活标签 → 结束
  3. 如果 X 是当前激活标签:
     a. 优先激活 X 右侧的相邻标签
     b. 右侧无标签则激活左侧的相邻标签
     c. 两边都无标签（只剩固定标签）→ 激活第一个固定标签
```

## 路由集成

### `router/index.ts` — afterEach 订阅

```typescript
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
```

### `routes.ts` — meta 扩展

```typescript
// vue-router 模块扩充
declare module 'vue-router' {
  interface RouteMeta {
    title: string;
    permission?: string;
    affix?: boolean; // 固定标签
    icon?: string; // 标签图标
    keepAlive?: boolean; // 是否缓存
  }
}
```

固定标签配置示例（控制台作为默认固定标签）：

```typescript
{
  path: 'console',
  name: 'Console',
  component: () => import('@/views/dashboard/console/index.vue'),
  meta: { title: '控制台', affix: true, keepAlive: true },
}
```

## 组件设计

### TabBar.vue

```
┌──────────────────────────────────────────────────────────────┐
│ [控制台 x]  [用户管理 x]  [角色管理 x]  [文件管理 x]  >>    │
└──────────────────────────────────────────────────────────────┘
```

**职责:**

- 渲染标签列表，水平滚动容器（overflow-x: auto, scrollbar-width: none）
- 点击标签 → router.push(tab.path)
- 点击关闭按钮 → store.removeTab(tab.id)
- 中键点击标签 → store.removeTab(tab.id)
- 右键点击标签 → 弹出 TabContextMenu（以该标签为操作目标）
- vuedraggable 拖拽排序

**Chrome 风格 CSS 要点:**

- 容器背景 `#dee1e6`，高度 36px，底部与内容区衔接
- 每个标签使用 `clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)` 裁出梯形
- 标签之间 `margin-right: -8px` 产生重叠效果
- 激活标签 `z-index: 1`，白色背景，高度 36px，box-shadow 浮起
- 非激活标签 `z-index: 0`，灰色背景 `#e8eaed`，高度 34px
- 关闭按钮 hover 时显示（opacity 过渡）
- 固定标签显示 pin 图标，不显示关闭按钮

**vuedraggable 集成:**

```html
<vue-draggable
  v-model="tabsStore.tabs"
  group="tabs"
  ghost-class="tab--ghost"
  drag-class="tab--dragging"
  @end="onDragEnd"
>
  <template #item="{ element }">
    <div class="tab" :class="tabClasses(element)">...</div>
  </template>
</vue-draggable>
```

### TabContextMenu.vue

**定位:**

- TabBar 中监听 `@contextmenu.prevent` 记录目标标签 id 和鼠标坐标
- 用 Naive UI 的 N Dropdown 实现，通过 props 传递 `show` / `x` / `y` / `targetId`

**菜单结构:**

```
┌──────────────────────────┐
│ 🔄  刷新                  │
│ 📌  固定标签 / 取消固定   │
│ ───────────────────────  │
│ ✕   关闭当前 / 关闭标签   │  ← 目标为激活标签时显示"关闭当前"，否则显示"关闭标签"
│ ◀   关闭左侧              │
│ ▶   关闭右侧              │
│ ○   关闭其他              │
│ □   关闭全部              │
└──────────────────────────┘
```

**图标映射（@vicons/ionicons5）:**

| 菜单项            | 图标组件                | 条件                   |
| ----------------- | ----------------------- | ---------------------- |
| 刷新              | `ReloadOutline`         | —                      |
| 固定标签          | `PinOutline`            | target.affix === false |
| 取消固定          | `PinSlashOutline`       | target.affix === true  |
| 关闭当前/关闭标签 | `CloseOutline`          | —                      |
| 关闭左侧          | `ChevronBackOutline`    | —                      |
| 关闭右侧          | `ChevronForwardOutline` | —                      |
| 关闭其他          | `RemoveCircleOutline`   | —                      |
| 关闭全部          | `CloseCircleOutline`    | —                      |

**禁用逻辑:**

- 关闭左侧: 左侧无可关闭标签时禁用
- 关闭右侧: 右侧无可关闭标签时禁用
- 关闭其他: 仅当前标签一个可关闭标签时禁用
- 关闭/关闭当前: 固定标签时禁用

**action 映射:**

| key           | 调用                           |
| ------------- | ------------------------------ |
| `refresh`     | `store.refreshTab(targetId)`   |
| `togglePin`   | `store.togglePin(targetId)`    |
| `close`       | `store.removeTab(targetId)`    |
| `closeLeft`   | `store.removeLeft(targetId)`   |
| `closeRight`  | `store.removeRight(targetId)`  |
| `closeOthers` | `store.removeOthers(targetId)` |
| `closeAll`    | `store.removeAll()`            |

## 布局集成

`layouts/index.vue` 变更:

```html
<script setup lang="ts">
  import { useTabsStore } from '@/stores/tabs';
  import TabBar from './components/TabBar.vue';

  const tabsStore = useTabsStore();
  onMounted(() => {
    tabsStore.restoreTabs();
  });
</script>

<template>
  <n-layout class="h-screen" has-sider>
    <n-layout-sider ...>
      <SidebarLogo />
      <SidebarMenu />
    </n-layout-sider>

    <n-layout>
      <HeaderBar />
      <TabBar />
      <!-- 新增 -->
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

## 依赖

```bash
pnpm add vuedraggable@next -D
```

## 边界情况

| 场景                                        | 处理逻辑                                                              |
| ------------------------------------------- | --------------------------------------------------------------------- |
| 关闭当前激活标签                            | 自动激活右侧相邻标签；若右侧无标签则激活左侧                          |
| 关闭最后一个可关闭标签                      | 仅保留固定标签                                                        |
| 固定标签操作关闭（关闭左侧/右侧/其他/全部） | 不受影响，仅操作 !affix 标签                                          |
| 拖拽排序                                    | 限制在标签列表内水平拖动                                              |
| 恢复时路由不存在                            | 过滤掉已删除路由的标签                                                |
| 路由无 meta.title                           | 使用 route.name 作为 fallback                                         |
| 中键关闭                                    | 与点击关闭按钮行为一致                                                |
| 刷新非当前标签                              | 先 router.push() 跳转，组件重建自动刷新                               |
| 刷新当前标签                                | 临时从 KeepAlive cachedNames 中移除 name，nextTick 恢复，触发组件重建 |

## 交付文件清单

| #   | 文件                                                       | 操作 | 内容说明                           |
| --- | ---------------------------------------------------------- | ---- | ---------------------------------- |
| 1   | `apps/admin-web/src/types/tabs.ts`                         | 新建 | Tab / PersistedTabs 接口           |
| 2   | `apps/admin-web/src/stores/tabs.ts`                        | 新建 | Pinia store + 持久化 + 所有 action |
| 3   | `apps/admin-web/src/layouts/components/TabBar.vue`         | 新建 | Chrome 风格标签栏                  |
| 4   | `apps/admin-web/src/layouts/components/TabContextMenu.vue` | 新建 | 右键菜单（N Dropdown + 图标）      |
| 5   | `apps/admin-web/src/layouts/index.vue`                     | 修改 | 集成 TabBar + KeepAlive            |
| 6   | `apps/admin-web/src/router/routes.ts`                      | 修改 | meta 扩展 affix/icon/keepAlive     |
| 7   | `apps/admin-web/src/router/index.ts`                       | 修改 | 新增 afterEach 订阅                |
| 8   | `apps/admin-web/src/stores/index.ts`                       | 修改 | 导出 useTabsStore                  |
