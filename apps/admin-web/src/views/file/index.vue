<script setup lang="ts">
import { onMounted, reactive, ref, h } from 'vue';
import type { DataTableColumn } from 'naive-ui';
import {
  NTag,
  NButton,
  NPopconfirm,
  NModal,
  NUpload,
  NImage,
  useMessage,
  useDialog,
} from 'naive-ui';
import {
  getFiles,
  deleteFile,
  getFileDownloadUrl,
  getFileViewUrl,
  formatFileSize,
} from '@/api/file';
import type { FileInfo } from '@/api/file';
import { useFileTypeIcon } from '@/composables/useFileTypeIcon';

const { getFileTypeIcon, isImage } = useFileTypeIcon();

// ─── 状态 ────────────────────────────────────────────────────

interface QueryForm {
  keyword: string;
}

const queryForm = reactive<QueryForm>({ keyword: '' });
const page = ref(1);
const limit = ref(20);
const total = ref(0);
const loading = ref(false);
const data = ref<FileInfo[]>([]);

const message = useMessage();
const dialog = useDialog();

// ─── 上传弹窗 ────────────────────────────────────────────────

const showUploadModal = ref(false);

function openUpload() {
  showUploadModal.value = true;
}

const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
};

function handleUploadFinish({ event }: { event?: ProgressEvent }) {
  if (event) {
    const xhr = event.target as XMLHttpRequest;
    try {
      const response = JSON.parse(xhr.responseText);
      if (response?.code === 0 || response?.data) {
        message.success('上传成功');
        showUploadModal.value = false;
        loadData();
      } else {
        message.error(response?.message || '上传失败');
      }
    } catch {
      message.error('上传失败');
    }
  }
}

function handleUploadError({ event }: { event?: ProgressEvent }) {
  if (event) {
    const xhr = event.target as XMLHttpRequest;
    try {
      const response = JSON.parse(xhr.responseText);
      message.error(response?.message || `上传失败 (${xhr.status})`);
    } catch {
      message.error(`上传失败 (${xhr.status})`);
    }
  } else {
    message.error('上传失败');
  }
}

// ─── 加载数据 ────────────────────────────────────────────────

async function loadData() {
  loading.value = true;
  try {
    const res = await getFiles({
      page: page.value,
      limit: limit.value,
      keyword: queryForm.keyword || undefined,
    });
    data.value = res.data.data.data;
    total.value = res.data.data.total;
  } catch (err: any) {
    message.error(err?.response?.data?.message || '加载文件列表失败');
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

// ─── 删除 ────────────────────────────────────────────────────

function handleDelete(row: FileInfo) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除文件「${row.originalName}」吗？删除后不可恢复。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteFile(row._id);
        message.success('删除成功');
        await loadData();
      } catch {
        message.error('删除失败');
      }
    },
  });
}

// ─── 下载 ────────────────────────────────────────────────────

function handleDownload(row: FileInfo) {
  const url = getFileDownloadUrl(row._id);
  const a = document.createElement('a');
  a.href = url;
  a.download = row.originalName;
  a.click();
}

// ─── 表格列 ──────────────────────────────────────────────────

const columns: DataTableColumn<FileInfo>[] = [
  {
    title: '#',
    key: 'key',
    align: 'center',
    width: 50,
    render: (_, index) => `${(page.value - 1) * limit.value + index + 1}`,
  },
  // {
  //   title: '预览',
  //   key: 'preview',
  //   width: 60,
  //   render(row) {
  //     const iconSrc = getFileTypeIcon(row.extension);
  //     return h('img', {
  //       src: iconSrc,
  //       style: { width: '40px', height: '40px' },
  //     });
  //   },
  // },
  {
    title: '文件名',
    key: 'originalName',
    width: 240,
    ellipsis: { tooltip: true },
    render(row) {
      const iconSrc = getFileTypeIcon(row.extension);
      if (isImage(row.extension)) {
        return h(
          'div',
          {
            style:
              'position: relative; display: inline-flex; align-items: center; cursor: pointer;',
          },
          [
            h('img', {
              src: iconSrc,
              style: { width: '40px', height: '40px', marginRight: '10px' },
            }),
            h('span', { class: 'text-primary', style: 'pointer-events: none;' }, row.originalName),
            h(NImage, {
              src: getFileViewUrl(row._id),
              style:
                'position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;',
              imgProps: { style: 'width: 100%; height: 100%; object-fit: cover;' },
              previewedImgProps: { style: { maxWidth: '80vw', maxHeight: '80vh' } },
            }),
          ],
        );
      }
      return h(
        'div',
        {
          style: 'position: relative; display: inline-flex; align-items: center; cursor: pointer;',
        },
        [
          h('img', {
            src: iconSrc,
            style: { width: '40px', height: '40px', marginRight: '10px' },
          }),
          h(
            'span',
            {
              class: 'cursor-pointer text-primary',
              onClick: () => handleDownload(row),
            },
            row.originalName,
          ),
        ],
      );
    },
  },
  {
    title: '类型',
    key: 'mimeType',
    width: 140,
    render(row) {
      const typeLabel = row.extension.toUpperCase().replace('.', '');
      return h(NTag, { size: 'small', type: 'info' }, { default: () => typeLabel });
    },
  },
  {
    title: '大小',
    key: 'size',
    width: 100,
    render(row) {
      return formatFileSize(row.size);
    },
  },
  {
    title: '上传时间',
    key: 'createDate',
    width: 170,
  },
  {
    title: '上传人',
    key: 'creator',
    width: 100,
  },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    render(row) {
      return [
        h(
          NButton,
          { size: 'small', quaternary: true, onClick: () => handleDownload(row) },
          { default: () => '下载' },
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
      <h2 class="text-20px font-semibold m-0">文件管理</h2>
      <n-button type="primary" @click="openUpload">上传文件</n-button>
    </div>

    <!-- 搜索栏 -->
    <n-card :bordered="true" class="mb-16px">
      <n-form inline>
        <n-form-item label="关键词">
          <n-input
            v-model:value="queryForm.keyword"
            placeholder="文件名"
            clearable
            @keyup.enter="handleSearch"
            style="width: 200px"
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
        :row-key="(row: FileInfo) => row._id"
        striped
      />
    </n-card>

    <!-- 上传弹窗 -->
    <n-modal
      v-model:show="showUploadModal"
      title="上传文件"
      preset="card"
      style="width: 520px"
      :mask-closable="false"
    >
      <n-upload
        :action="'/api/v1/files/upload'"
        :headers="uploadHeaders"
        :max="5"
        :default-upload="true"
        @finish="handleUploadFinish"
        @error="handleUploadError"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf,application/zip,text/plain,text/csv"
      >
        <n-upload-dragger>
          <div class="text-center py-24px">
            <p class="text-16px mb-8px">点击或拖拽文件到此区域上传</p>
            <p class="text-12px text-#999">
              支持 JPG / PNG / GIF / WebP / SVG / PDF / ZIP / TXT / CSV
              <br />
              单个文件最大 10MB
            </p>
          </div>
        </n-upload-dragger>
      </n-upload>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showUploadModal = false">关闭</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
