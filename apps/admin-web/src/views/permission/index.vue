<script setup lang="ts">
import { onMounted, reactive, ref, h } from 'vue';
import type { DataTableColumn } from 'naive-ui';
import { NTag, NButton, NPopconfirm, useMessage } from 'naive-ui';
import { getPermissions, syncPermissions, deletePermission } from '@/api/permission';
import type { PermissionInfo } from '@/api/permission';

// ─── 状态 ────────────────────────────────────────────────────

interface QueryForm {
  keyword: string;
  module: string;
}

const queryForm = reactive<QueryForm>({ keyword: '', module: '' });
const page = ref(1);
const limit = ref(20);
const total = ref(0);
const loading = ref(false);
const syncing = ref(false);
const data = ref<PermissionInfo[]>([]);
const modules = ref<string[]>([]);

const message = useMessage();

// ─── 加载数据 ────────────────────────────────────────────────

async function loadData() {
  loading.value = true;
  try {
    const res = await getPermissions({
      page: page.value,
      limit: limit.value,
      keyword: queryForm.keyword || undefined,
      module: queryForm.module || undefined,
    });
    data.value = res.data.data.data;
    total.value = res.data.data.total;

    // 提取所有 module 作为筛选条件
    const modSet = new Set<string>();
    res.data.data.data.forEach((p: PermissionInfo) => modSet.add(p.module));
    modules.value = Array.from(modSet).sort();
  } catch {
    message.error('加载权限列表失败');
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

// ─── 同步 ────────────────────────────────────────────────────

async function handleSync() {
  syncing.value = true;
  try {
    await syncPermissions();
    message.success('权限同步成功');
    loadData();
  } catch {
    message.error('同步失败');
  } finally {
    syncing.value = false;
  }
}

// ─── 删除 ────────────────────────────────────────────────────

async function handleDelete(row: PermissionInfo) {
  try {
    await deletePermission(row._id);
    message.success('删除成功');
    loadData();
  } catch {
    message.error('删除失败，该权限可能已被角色绑定');
  }
}

// ─── 表格列 ──────────────────────────────────────────────────

const columns: DataTableColumn<PermissionInfo>[] = [
  { type: 'index', title: '序号', width: 64, align: 'center' },
  { title: '名称', key: 'name', width: 160 },
  { title: '权限编码', key: 'code', width: 180 },
  {
    title: '所属模块',
    key: 'module',
    width: 120,
    render(row) {
      return h(NTag, { size: 'small', type: 'info' }, { default: () => row.module });
    },
  },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
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
  { title: '创建时间', key: 'createdAt', width: 170 },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render(row) {
      return h(
        NPopconfirm,
        {
          onPositiveClick: () => handleDelete(row),
        },
        {
          default: () => '删除后不可恢复，确定？',
          trigger: () =>
            h(
              NButton,
              { size: 'small', quaternary: true, type: 'error' },
              { default: () => '删除' },
            ),
        },
      );
    },
  },
];

// ─── 初始化 ──────────────────────────────────────────────────

onMounted(loadData);
</script>

<template>
  <div>
    <div class="flex-between mb-20px">
      <h2 class="text-20px font-semibold m-0">权限管理</h2>
      <n-button type="primary" :loading="syncing" @click="handleSync">同步权限</n-button>
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
        <n-form-item label="模块">
          <n-select
            v-model:value="queryForm.module"
            :options="[
              { label: '全部', value: '' },
              ...modules.map((m) => ({ label: m, value: m })),
            ]"
            style="width: 140px"
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
        :row-key="(row: PermissionInfo) => row._id"
        striped
      />
    </n-card>
  </div>
</template>
