<script setup lang="ts">
import { onMounted, reactive, ref, h } from 'vue';
import type { DataTableColumn, FormInst } from 'naive-ui';
import { NTag, NButton, NPopconfirm, NModal, useMessage, useDialog } from 'naive-ui';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  bindRolePermissions,
  getRolePermissions,
} from '@/api/role';
import { getPermissionTree } from '@/api/permission';
import type { RoleInfo } from '@/api/role';
import type { PermissionTreeNode } from '@/api/permission';

// ─── 状态 ────────────────────────────────────────────────────

interface QueryForm {
  keyword: string;
  status: number;
}

const queryForm = reactive<QueryForm>({ keyword: '', status: 1 });
const page = ref(1);
const limit = ref(20);
const total = ref(0);
const loading = ref(false);
const data = ref<RoleInfo[]>([]);

const message = useMessage();
const dialog = useDialog();

// ─── 创建/编辑弹窗 ───────────────────────────────────────────

const showFormModal = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const formRef = ref<FormInst | null>(null);
const formState = reactive({
  name: '',
  code: '',
  description: '',
});

const formRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 32, message: '名称 2-32 个字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { min: 2, max: 32, message: '编码 2-32 个字符', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      message: '编码只允许字母、数字和下划线',
      trigger: 'blur',
    },
  ],
};

// ─── 权限配置弹窗 ────────────────────────────────────────────

const showPermModal = ref(false);
const permRoleId = ref<string>('');
const permRoleName = ref('');
const permTree = ref<PermissionTreeNode[]>([]);
const checkedPermCodes = ref<string[]>([]);

// ─── 加载数据 ────────────────────────────────────────────────

async function loadData() {
  loading.value = true;
  try {
    const res = await getRoles({
      page: page.value,
      limit: limit.value,
      keyword: queryForm.keyword || undefined,
      status: queryForm.status || undefined,
    });
    data.value = res.data.data.data;
    total.value = res.data.data.total;
  } catch (err: any) {
    message.error(err?.response?.data?.message || '加载角色列表失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  loadData();
}

function handlePageChange(p: number) {
  page.value = p;
  loadData();
}

// ─── 创建/编辑 ───────────────────────────────────────────────

function openCreate() {
  isEditing.value = false;
  editingId.value = null;
  formState.name = '';
  formState.code = '';
  formState.description = '';
  showFormModal.value = true;
}

function openEdit(row: RoleInfo) {
  isEditing.value = true;
  editingId.value = row._id;
  formState.name = row.name;
  formState.code = row.code;
  formState.description = row.description ?? '';
  showFormModal.value = true;
}

async function handleFormSubmit() {
  try {
    if (isEditing.value && editingId.value) {
      await updateRole(editingId.value, {
        name: formState.name || undefined,
        description: formState.description || undefined,
      });
      message.success('更新成功');
    } else {
      await createRole({
        name: formState.name,
        code: formState.code,
        description: formState.description || undefined,
      });
      message.success('创建成功');
    }
    showFormModal.value = false;
    await loadData();
  } catch {
    message.error('操作失败');
  }
}

// ─── 删除 ────────────────────────────────────────────────────

function handleDelete(row: RoleInfo) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除角色「${row.name}」吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteRole(row._id);
        message.success('删除成功');
        await loadData();
      } catch {
        message.error('删除失败');
      }
    },
  });
}

// ─── 权限配置 ────────────────────────────────────────────────

async function openPermissionConfig(row: RoleInfo) {
  permRoleId.value = row._id;
  permRoleName.value = row.name;
  checkedPermCodes.value = [];

  try {
    const [treeRes, permRes] = await Promise.all([
      getPermissionTree(),
      getRolePermissions(row._id),
    ]);
    permTree.value = treeRes.data.data;
    checkedPermCodes.value = permRes.data.data;
  } catch {
    message.error('加载权限数据失败');
  }

  showPermModal.value = true;
}

async function savePermissions() {
  try {
    await bindRolePermissions(permRoleId.value, checkedPermCodes.value);
    message.success('权限配置已保存');
    showPermModal.value = false;
  } catch {
    message.error('保存失败');
  }
}

// ─── 表格列 ──────────────────────────────────────────────────

const columns: DataTableColumn<RoleInfo>[] = [
  {
    title: '#',
    key: 'key',
    align: 'center',
    width: 50,
    render: (_, index) => {
      return `${index + 1}`;
    },
  },
  { title: '名称', key: 'name', width: 140 },
  { title: '编码', key: 'code', width: 140 },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  {
    title: '权限数',
    key: 'permissions',
    width: 100,
    render(row) {
      return `${row.permissions?.length ?? 0} 项`;
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      return h(
        NTag,
        { type: row.status === 1 ? 'success' : 'error', size: 'small' },
        { default: () => (row.status === 1 ? '启用' : '禁用') },
      );
    },
  },
  { title: '创建时间', key: 'createDate', width: 170 },
  {
    title: '操作',
    key: 'actions',
    width: 240,
    render(row) {
      return [
        h(
          NButton,
          { size: 'small', quaternary: true, onClick: () => openEdit(row) },
          { default: () => '编辑' },
        ),
        h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            style: { marginLeft: '4px' },
            onClick: () => openPermissionConfig(row),
          },
          { default: () => '权限' },
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDelete(row),
          },
          {
            default: () => '确定删除？',
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

onMounted(loadData);
</script>

<template>
  <div>
    <div class="flex-between mb-20px">
      <h2 class="text-20px font-semibold m-0">角色管理</h2>
      <n-button type="primary" @click="openCreate">新增角色</n-button>
    </div>

    <!-- 搜索栏 -->
    <n-card :bordered="true" class="mb-16px">
      <n-form inline>
        <n-form-item label="关键词">
          <n-input
            v-model:value="queryForm.keyword"
            placeholder="名称/编码"
            clearable
            @keyup.enter="handleSearch"
            style="width: 200px"
          />
        </n-form-item>
        <n-form-item label="状态">
          <n-select
            v-model:value="queryForm.status"
            :options="[
              { label: '全部', value: '' },
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]"
            style="width: 120px"
            clearable
          />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" @click="handleSearch">查询</n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 数据表格 -->
    <n-card :bordered="true">
      <n-data-table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="{
          page: page,
          pageSize: limit,
          itemCount: total,
          onChange: handlePageChange,
          showSizePicker: false,
        }"
        :row-key="(row: RoleInfo) => row._id"
        striped
      />
    </n-card>

    <!-- 创建/编辑弹窗 -->
    <n-modal
      v-model:show="showFormModal"
      :title="isEditing ? '编辑角色' : '新增角色'"
      preset="card"
      style="width: 480px"
      :mask-closable="false"
    >
      <n-form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        label-placement="left"
        label-width="80"
      >
        <n-form-item label="名称" path="name">
          <n-input v-model:value="formState.name" placeholder="角色名称" />
        </n-form-item>
        <n-form-item label="编码" path="code">
          <n-input
            v-model:value="formState.code"
            placeholder="角色编码（创建后不可修改）"
            :disabled="isEditing"
          />
        </n-form-item>
        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="formState.description"
            placeholder="角色描述（选填）"
            type="textarea"
            rows="3"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showFormModal = false">取消</n-button>
          <n-button type="primary" @click="handleFormSubmit">确定</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 权限配置弹窗 -->
    <n-modal
      v-model:show="showPermModal"
      title="配置权限"
      preset="card"
      style="width: 520px"
      :mask-closable="false"
    >
      <p class="text-14px text-#666 mb-16px">为「{{ permRoleName }}」分配权限</p>

      <div v-if="permTree.length === 0" class="text-center py-24px text-#999">
        暂无权限数据，请先在权限管理页面同步权限。
      </div>

      <div v-for="group in permTree" :key="group.module" class="mb-16px">
        <p class="font-medium text-14px mb-8px capitalize">{{ group.module }}</p>
        <n-checkbox-group v-model:value="checkedPermCodes">
          <n-space>
            <n-checkbox
              v-for="perm in group.children"
              :key="perm._id"
              :value="perm.code"
              :label="perm.name"
            />
          </n-space>
        </n-checkbox-group>
      </div>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showPermModal = false">取消</n-button>
          <n-button type="primary" @click="savePermissions">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>
