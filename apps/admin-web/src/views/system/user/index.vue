<script setup lang="ts">
import { onMounted, reactive, ref, h } from 'vue';
import type { DataTableColumn } from 'naive-ui';
import { NTag, NButton, NPopconfirm, NImage, useMessage, useDialog } from 'naive-ui';
import { getUsers, deleteUser } from '@/api/user';
import { getAllRoles } from '@/api/role';
import type { UserInfo } from '@/types/api';
import type { RoleInfo } from '@/api/role';
import { statusColors, statusLabels, statusSearchOptions } from '@/constants/user';
import { getFileViewUrl } from '@/api/file';
import UserFormModal from './components/UserFormModal.vue';

// ─── 状态 ────────────────────────────────────────────────────

interface QueryForm {
  keyword: string;
  status: string;
}

const queryForm = reactive<QueryForm>({ keyword: '', status: '' });
const page = ref(1);
const limit = ref(20);
const total = ref(0);
const loading = ref(false);
const data = ref<UserInfo[]>([]);
const roles = ref<RoleInfo[]>([]);

const message = useMessage();
const dialog = useDialog();

// ─── 表单弹窗 ────────────────────────────────────────────────

const showFormModal = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const selectedUser = ref<Partial<UserInfo> | null>(null);

function openCreate() {
  formMode.value = 'create';
  selectedUser.value = null;
  showFormModal.value = true;
}

function openEdit(row: UserInfo) {
  formMode.value = 'edit';
  selectedUser.value = row;
  showFormModal.value = true;
}

function handleFormSaved() {
  showFormModal.value = false;
  loadData();
}

// ─── 加载数据 ────────────────────────────────────────────────

async function loadData() {
  loading.value = true;
  try {
    const res = await getUsers({
      page: page.value,
      limit: limit.value,
      keyword: queryForm.keyword || undefined,
      status: queryForm.status || undefined,
    });
    data.value = res.data.data.data;
    total.value = res.data.data.total;
  } catch {
    message.error('加载用户列表失败');
  } finally {
    loading.value = false;
  }
}

async function loadRoles() {
  try {
    const res = await getAllRoles();
    roles.value = res.data.data;
  } catch {
    // 角色列表加载失败不阻塞页面
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

// ─── 删除 ────────────────────────────────────────────────────

function handleDelete(row: UserInfo) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除用户「${row.username}」吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteUser(row._id);
        message.success('删除成功');
        await loadData();
      } catch {
        message.error('删除失败');
      }
    },
  });
}

// ─── 表格列 ──────────────────────────────────────────────────

const columns: DataTableColumn<UserInfo>[] = [
  {
    title: '#',
    key: 'key',
    align: 'center',
    width: 50,
    render: (_, index) => {
      return `${index + 1}`;
    },
  },
  {
    title: '头像',
    key: 'avatar',
    width: 60,
    render(row) {
      if (row.avatar) {
        return h(NImage, {
          width: 36,
          height: 36,
          src: getFileViewUrl(row.avatar),
          style: { borderRadius: '50%', objectFit: 'cover' },
        });
      }
      return null;
    },
  },
  { title: '账号', key: 'username', width: 140 },
  { title: '昵称', key: 'nickname', width: 140 },
  { title: '邮箱', key: 'email', width: 180 },
  { title: '角色', key: 'role', width: 120 },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      return h(
        NTag,
        {
          type: statusColors[row.status] as 'success' | 'error' | 'warning' | 'info' | 'default',
          size: 'small',
        },
        { default: () => statusLabels[row.status] ?? '未知' },
      );
    },
  },
  { title: '创建时间', key: 'createDate', width: 170 },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render(row) {
      return [
        h(
          NButton,
          { size: 'small', quaternary: true, onClick: () => openEdit(row) },
          { default: () => '编辑' },
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
                { size: 'small', quaternary: true, type: 'error' },
                { default: () => '删除' },
              ),
          },
        ),
      ];
    },
  },
];

// ─── 初始化 ──────────────────────────────────────────────────

onMounted(() => {
  loadData();
  loadRoles();
});
</script>

<template>
  <div>
    <div class="flex-between mb-20px">
      <h2 class="text-20px font-semibold m-0">用户管理</h2>
      <n-button type="primary" @click="openCreate">新增用户</n-button>
    </div>

    <!-- 搜索栏 -->
    <n-card :bordered="true" class="mb-16px">
      <n-form inline>
        <n-form-item label="关键词">
          <n-input
            v-model:value="queryForm.keyword"
            placeholder="账号/昵称/邮箱"
            clearable
            @keyup.enter="handleSearch"
            style="width: 200px"
          />
        </n-form-item>
        <n-form-item label="状态">
          <n-select
            v-model:value="queryForm.status"
            :options="statusSearchOptions"
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
        :row-key="(row: UserInfo) => row._id"
        striped
      />
    </n-card>

    <!-- 新增/编辑弹窗 -->
    <UserFormModal
      :visible="showFormModal"
      :mode="formMode"
      :user-data="selectedUser"
      :roles="roles"
      @close="showFormModal = false"
      @saved="handleFormSaved"
    />
  </div>
</template>
