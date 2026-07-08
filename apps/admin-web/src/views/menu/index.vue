<script setup lang="ts">
import { onMounted, ref, h } from 'vue';
import type { DataTableColumn } from 'naive-ui';
import { NTag, NButton, NPopconfirm, useMessage, useDialog } from 'naive-ui';
import { getMenuTree, deleteMenu } from '@/api/menu';
import type { MenuTreeNode } from '@/api/menu';
import MenuFormModal from './components/MenuFormModal.vue';

// ─── 状态 ────────────────────────────────────────────────────

const loading = ref(false);
const treeData = ref<MenuTreeNode[]>([]);

const message = useMessage();
const dialog = useDialog();

// ─── 弹窗状态 ────────────────────────────────────────────────

const showFormModal = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const selectedMenu = ref<Partial<MenuTreeNode> | null>(null);
const parentMenu = ref<Partial<MenuTreeNode> | null>(null);

function openCreate(parent?: MenuTreeNode) {
  formMode.value = 'create';
  selectedMenu.value = null;
  parentMenu.value = parent ?? null;
  showFormModal.value = true;
}

function openEdit(row: MenuTreeNode) {
  formMode.value = 'edit';
  selectedMenu.value = row;
  parentMenu.value = null;
  showFormModal.value = true;
}

function onSaved() {
  showFormModal.value = false;
  loadTree();
}

// ─── 加载数据 ────────────────────────────────────────────────

async function loadTree() {
  loading.value = true;
  try {
    const res = await getMenuTree();
    treeData.value = res.data.data;
  } catch (err) {
    const errorMsg = (err as { message?: string })?.message ?? '加载菜单树失败';
    message.error(errorMsg);
  } finally {
    loading.value = false;
  }
}

// ─── 删除 ────────────────────────────────────────────────────

function handleDelete(row: MenuTreeNode) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除菜单「${row.name}」吗？子菜单将一并删除。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteMenu(row._id);
        message.success('删除成功');
        loadTree();
      } catch (err) {
        const errorMsg = (err as { message?: string })?.message ?? '删除失败';
        message.error(errorMsg);
      }
    },
  });
}

// ─── 辅助函数 ────────────────────────────────────────────────

type MenuType = 'dir' | 'menu' | 'button';

const typeConfig: Record<MenuType, { type: 'success' | 'info' | 'warning'; label: string }> = {
  dir: { type: 'warning', label: '目录' },
  menu: { type: 'info', label: '菜单' },
  button: { type: 'success', label: '按钮' },
};

function getTypeTag(type: string) {
  const config = typeConfig[type as MenuType] ?? { type: 'default' as const, label: type };
  return config;
}

/** 展平树形数据以支持树形表格 */
function flattenTree(nodes: MenuTreeNode[], level = 0): Array<MenuTreeNode & { _level: number }> {
  const result: Array<MenuTreeNode & { _level: number }> = [];
  for (const node of nodes) {
    result.push({ ...node, _level: level });
    if (node.children?.length) {
      result.push(...flattenTree(node.children, level + 1));
    }
  }
  return result;
}

const flatData = ref<Array<MenuTreeNode & { _level: number }>>([]);

function refreshFlatData() {
  flatData.value = flattenTree(treeData.value);
}

// ─── 表格列 ──────────────────────────────────────────────────

const columns: DataTableColumn<MenuTreeNode & { _level: number }>[] = [
  {
    title: '名称',
    key: 'name',
    width: 240,
    render(row) {
      const indent = row._level * 24;
      return h(
        'div',
        {
          style: { paddingLeft: `${indent}px`, display: 'flex', alignItems: 'center', gap: '8px' },
        },
        [
          row.icon ? h('span', { style: { fontSize: '16px' } }, row.icon) : null,
          h('span', row.name),
        ],
      );
    },
  },
  { title: '路径', key: 'path', width: 160 },
  {
    title: '类型',
    key: 'type',
    width: 70,
    render(row) {
      const config = getTypeTag(row.type);
      return h(NTag, { type: config.type, size: 'small' }, { default: () => config.label });
    },
  },
  { title: '权限标识', key: 'permission', width: 140 },
  { title: '排序', key: 'sort', width: 60, align: 'center' },
  {
    title: '状态',
    key: 'status',
    width: 70,
    render(row) {
      return h(
        NTag,
        { type: row.status === 1 ? 'success' : 'error', size: 'small' },
        { default: () => (row.status === 1 ? '启用' : '禁用') },
      );
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 240,
    render(row) {
      return [
        h(
          NButton,
          { size: 'small', quaternary: true, onClick: () => openCreate(row) },
          { default: () => '新增子菜单' },
        ),
        h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            style: { marginLeft: '4px' },
            onClick: () => openEdit(row),
          },
          { default: () => '编辑' },
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDelete(row),
          },
          {
            default: () => '子菜单将一并删除，确定？',
            trigger: () =>
              h(
                NButton,
                { size: 'small', quaternary: true, type: 'error', style: { marginLeft: '4px' } },
                { default: () => '删除' },
              ),
          },
        ),
      ];
    },
  },
];

// ─── 初始化 ──────────────────────────────────────────────────

onMounted(async () => {
  await loadTree();
  refreshFlatData();
});
</script>

<template>
  <div>
    <div class="flex-between mb-20px">
      <h2 class="text-20px font-semibold m-0">菜单管理</h2>
      <n-button type="primary" @click="openCreate()">新增根菜单</n-button>
    </div>

    <n-card :bordered="true">
      <n-data-table
        :columns="columns"
        :data="flatData"
        :loading="loading"
        :row-key="(row: MenuTreeNode) => row._id"
        :bordered="true"
        striped
      />
    </n-card>

    <MenuFormModal
      :visible="showFormModal"
      :mode="formMode"
      :menu-data="selectedMenu"
      :parent-menu="parentMenu"
      :menu-tree="treeData"
      @close="showFormModal = false"
      @saved="onSaved"
    />
  </div>
</template>
