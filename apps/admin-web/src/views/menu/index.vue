<script setup lang="ts">
import { onMounted, reactive, ref, h } from 'vue';
import type { DataTableColumn, FormInst } from 'naive-ui';
import { NTag, NButton, NPopconfirm, useMessage, useDialog } from 'naive-ui';
import { getMenuTree, createMenu, updateMenu, deleteMenu } from '@/api/menu';
import type { MenuTreeNode } from '@/api/menu';

// ─── 状态 ────────────────────────────────────────────────────

const loading = ref(false);
const treeData = ref<MenuTreeNode[]>([]);
const expandedRowKeys = ref<string[]>([]);

const message = useMessage();
const dialog = useDialog();

// ─── 表单弹窗 ────────────────────────────────────────────────

const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const formRef = ref<FormInst | null>(null);

const formState = reactive({
  name: '',
  path: '',
  icon: '',
  parentId: null as string | null,
  permission: '',
  sort: 0,
  type: 'menu',
  isExternal: false,
});

const formRules = {
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { max: 32, message: '名称最多 32 个字符', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择类型', trigger: 'blur' }],
};

const typeOptions = [
  { label: '目录', value: 'dir' },
  { label: '菜单', value: 'menu' },
  { label: '按钮', value: 'button' },
];

// ─── 加载数据 ────────────────────────────────────────────────

async function loadTree() {
  loading.value = true;
  try {
    const res = await getMenuTree();
    treeData.value = res.data.data;
  } catch {
    message.error('加载菜单树失败');
  } finally {
    loading.value = false;
  }
}

// ─── 创建/编辑 ───────────────────────────────────────────────

function resetForm() {
  formState.name = '';
  formState.path = '';
  formState.icon = '';
  formState.parentId = null;
  formState.permission = '';
  formState.sort = 0;
  formState.type = 'menu';
  formState.isExternal = false;
}

function openCreate(parent?: MenuTreeNode) {
  isEditing.value = false;
  editingId.value = null;
  resetForm();

  if (parent) {
    formState.parentId = parent._id;
    // 子菜单默认类型跟随父级
    formState.type = parent.type === 'dir' ? 'menu' : parent.type;
  }

  showModal.value = true;
}

function openEdit(row: MenuTreeNode) {
  isEditing.value = true;
  editingId.value = row._id;
  formState.name = row.name;
  formState.path = row.path ?? '';
  formState.icon = row.icon ?? '';
  formState.parentId = row.parentId;
  formState.permission = row.permission ?? '';
  formState.sort = row.sort;
  formState.type = row.type;
  formState.isExternal = row.isExternal;
  showModal.value = true;
}

async function handleFormSubmit() {
  try {
    if (isEditing.value && editingId.value) {
      await updateMenu(editingId.value, {
        name: formState.name,
        path: formState.path || undefined,
        icon: formState.icon || undefined,
        permission: formState.permission || undefined,
        sort: formState.sort,
        type: formState.type,
        isExternal: formState.isExternal,
      });
      message.success('更新成功');
    } else {
      await createMenu({
        name: formState.name,
        path: formState.path || undefined,
        icon: formState.icon || undefined,
        parentId: formState.parentId,
        permission: formState.permission || undefined,
        sort: formState.sort,
        type: formState.type,
        isExternal: formState.isExternal,
      });
      message.success('创建成功');
    }
    showModal.value = false;
    loadTree();
  } catch {
    message.error('操作失败');
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
      } catch {
        message.error('删除失败');
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
    width: 280,
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
  { title: '路径', key: 'path', width: 180 },
  {
    title: '类型',
    key: 'type',
    width: 80,
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
    width: 80,
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

    <!-- 数据表格 -->
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

    <!-- 创建/编辑弹窗 -->
    <n-modal
      v-model:show="showModal"
      :title="isEditing ? '编辑菜单' : '新增菜单'"
      preset="card"
      style="width: 520px"
      :mask-closable="false"
    >
      <n-form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        label-placement="left"
        label-width="80"
      >
        <n-form-item label="类型" path="type">
          <n-radio-group v-model:value="formState.type">
            <n-radio
              v-for="opt in typeOptions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
            />
          </n-radio-group>
        </n-form-item>
        <n-form-item label="名称" path="name">
          <n-input v-model:value="formState.name" placeholder="菜单名称" />
        </n-form-item>
        <n-form-item label="路径" path="path">
          <n-input v-model:value="formState.path" placeholder="路由路径，如 /users" />
        </n-form-item>
        <n-form-item label="图标" path="icon">
          <n-input v-model:value="formState.icon" placeholder="图标名称（可选）" />
        </n-form-item>
        <n-form-item label="权限标识" path="permission">
          <n-input v-model:value="formState.permission" placeholder="如 user:read（可选）" />
        </n-form-item>
        <n-form-item label="排序" path="sort">
          <n-input-number
            v-model:value="formState.sort"
            :min="0"
            :max="9999"
            style="width: 120px"
          />
        </n-form-item>
        <n-form-item v-if="formState.type === 'menu'" label="外链">
          <n-switch v-model:value="formState.isExternal" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" @click="handleFormSubmit">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>
