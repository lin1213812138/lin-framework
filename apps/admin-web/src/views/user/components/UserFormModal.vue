<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import type { FormInst, UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui';
import { useMessage } from 'naive-ui';
import { createUser, updateUser } from '@/api/user';
import { uploadFile, getFileViewUrl } from '@/api/file';
import type { RoleInfo } from '@/api/role';
import type { UserInfo } from '@/types/api';
import ImageCropperModal from '@/components/ImageCropperModal.vue';

const props = defineProps<{
  visible: boolean;
  mode: 'create' | 'edit';
  userData: Partial<UserInfo> | null;
  roles: RoleInfo[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const message = useMessage();
const formRef = ref<FormInst | null>(null);

const form = reactive({
  username: '',
  password: '',
  nickname: '',
  email: '',
  avatar: '',
  role: '',
});

const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 2, max: 32, message: '账号 2-32 个字符', trigger: 'blur' },
  ],
  password: [
    {
      required: true,
      validator: (_rule: unknown, value: string) => {
        if (props.mode === 'create' && !value) {
          return new Error('请输入密码');
        }
        if (value && (value.length < 6 || value.length > 32)) {
          return new Error('密码 6-32 个字符');
        }
        return true;
      },
      trigger: 'blur',
    },
  ],
  nickname: [{ max: 32, message: '昵称最多 32 个字符', trigger: 'blur' }],
};

const fileList = ref<UploadFileInfo[]>([]);

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.mode === 'edit' && props.userData) {
        form.username = props.userData.username ?? '';
        form.password = '';
        form.nickname = props.userData.nickname ?? '';
        form.email = props.userData.email ?? '';
        form.avatar = props.userData.avatar ?? '';
        form.role = props.userData.role ?? '';

        // 初始化文件列表（已有头像时回显）
        fileList.value = props.userData.avatar
          ? [
              {
                id: '__avatar__',
                name: 'avatar.jpg',
                status: 'finished' as const,
                type: 'image/jpeg',
                url: getFileViewUrl(props.userData.avatar),
              },
            ]
          : [];
      } else {
        form.username = '';
        form.password = '';
        form.nickname = '';
        form.email = '';
        form.avatar = '';
        form.role = '';
        fileList.value = [];
      }
    }
  },
);

// ─── 图片裁剪 ────────────────────────────────────────────────

const showCropper = ref(false);
const cropFile = ref<File | null>(null);

/** 上传文件到后端（供非图片文件使用） */
function doUpload(file: File, onFinish: () => void, onError: () => void) {
  uploadFile(file)
    .then((fileInfo) => {
      form.avatar = fileInfo._id;
      fileList.value = [
        {
          id: fileInfo._id,
          name: fileInfo.originalName,
          status: 'finished' as const,
          type: fileInfo.mimeType,
          url: getFileViewUrl(fileInfo._id),
        },
      ];
      onFinish();
    })
    .catch(() => {
      onError();
    });
}

const handleUpload = ({ file, onFinish, onError }: UploadCustomRequestOptions) => {
  const nativeFile = file.file;
  if (!nativeFile) return;

  // 非图片文件直接上传（走 Naive UI 的 onFinish 回调）
  if (!nativeFile.type.startsWith('image/')) {
    doUpload(nativeFile, onFinish, onError);
    return;
  }

  // 图片文件：打开裁剪弹窗，不上传、不调用 onFinish
  // 裁剪确认后自行上传并替换 fileList
  cropFile.value = nativeFile;
  showCropper.value = true;
};

function handleCropConfirm(croppedFile: File) {
  showCropper.value = false;
  cropFile.value = null;

  uploadFile(croppedFile)
    .then((fileInfo) => {
      form.avatar = fileInfo._id;
      // 直接替换 fileList，覆盖 Naive UI 内部保留的 pending 条目
      fileList.value = [
        {
          id: fileInfo._id,
          name: fileInfo.originalName,
          status: 'finished' as const,
          type: fileInfo.mimeType,
          url: getFileViewUrl(fileInfo._id),
        },
      ];
      message.success('头像上传成功');
    })
    .catch(() => {
      message.error('头像上传失败');
    });
}

function handleRemove() {
  form.avatar = '';
  return true;
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  try {
    if (props.mode === 'create') {
      await createUser({
        username: form.username,
        password: form.password,
        nickname: form.nickname || undefined,
        email: form.email || undefined,
        avatar: form.avatar || undefined,
        role: form.role || undefined,
      });
      message.success('创建成功');
    } else if (props.userData?._id) {
      await updateUser(props.userData._id, {
        nickname: form.nickname || undefined,
        email: form.email || undefined,
        avatar: form.avatar || undefined,
        role: form.role || undefined,
      });
      message.success('更新成功');
    }
    emit('saved');
  } catch {
    message.error(props.mode === 'create' ? '创建失败' : '更新失败');
  }
}

function handleClose() {
  emit('close');
}
</script>

<template>
  <n-modal
    :show="visible"
    :title="mode === 'create' ? '新增用户' : '编辑用户'"
    preset="card"
    style="width: 520px"
    :mask-closable="false"
    @update:show="handleClose"
  >
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="80">
      <n-form-item label="头像">
        <n-upload
          :key="visible"
          accept="image/jpeg,image/png,image/gif,image/webp"
          list-type="image-card"
          :max="1"
          v-model:file-list="fileList"
          :custom-request="handleUpload"
          @remove="handleRemove"
        />
      </n-form-item>
      <n-form-item v-if="mode === 'create'" label="账号" path="username">
        <n-input v-model:value="form.username" placeholder="账号" />
      </n-form-item>
      <n-form-item v-if="mode === 'create'" label="密码" path="password">
        <n-input
          v-model:value="form.password"
          placeholder="密码"
          type="password"
          show-password-on="click"
        />
      </n-form-item>
      <n-form-item label="昵称" path="nickname">
        <n-input v-model:value="form.nickname" placeholder="昵称" />
      </n-form-item>
      <n-form-item label="邮箱" path="email">
        <n-input v-model:value="form.email" placeholder="邮箱" />
      </n-form-item>
      <n-form-item label="角色" path="role">
        <n-select
          v-model:value="form.role"
          :options="roles.map((r: RoleInfo) => ({ label: r.name, value: r.code }))"
          placeholder="选择角色"
          clearable
        />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" @click="handleSubmit">{{
          mode === 'create' ? '确定' : '保存'
        }}</n-button>
      </n-space>
    </template>
  </n-modal>

  <ImageCropperModal
    :show="showCropper"
    :file="cropFile"
    @confirm="handleCropConfirm"
    @cancel="showCropper = false"
  />
</template>
