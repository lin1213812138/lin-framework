<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

const props = defineProps<{
  show: boolean;
  file: File | null;
}>();

const emit = defineEmits<{
  (e: 'confirm', croppedFile: File): void;
  (e: 'cancel'): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let cropperInstance: Cropper | null = null;

/** 销毁裁剪器 */
function destroyCropper() {
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
}

/** canvas.toBlob 的 Promise 封装 */
function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('canvas.toBlob returned null'));
        }
      },
      type,
      quality,
    );
  });
}

async function handleConfirm() {
  if (!cropperInstance || !props.file) return;

  const file = props.file; // 立即捕获，防止异步期间变更
  const canvas = cropperInstance.getCroppedCanvas({
    maxWidth: 800,
    maxHeight: 800,
    imageSmoothingQuality: 'high',
  });

  // 空画布时直接返回
  if (canvas.width === 0 || canvas.height === 0) return;

  try {
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
    const name = file.name.replace(/\.[^.]+$/, '.jpg');
    const croppedFile = new File([blob], name, { type: 'image/jpeg' });
    destroyCropper();
    emit('confirm', croppedFile);
  } catch {
    // toBlob 失败，不做处理
  }
}

function handleCancel() {
  if (!cropperInstance) return; // 已销毁，防止 @update:show 二次触发
  destroyCropper();
  emit('cancel');
}

/** 程序化创建 img → 加载完成后初始化 cropper */
function initCropper(imageUrl: string) {
  destroyCropper();

  const container = containerRef.value;
  if (!container) return;

  // 清空容器，避免重复追加
  container.innerHTML = '';

  const img = document.createElement('img');
  img.style.maxWidth = '100%';
  img.style.display = 'block';

  img.onload = () => {
    container.appendChild(img);
    cropperInstance = new Cropper(img, {
      aspectRatio: NaN, // 自由比例
      viewMode: 2, // 限制画布不超出容器（拖拽边界）
      dragMode: 'move', // 默认拖动图片而非创建新裁剪框
      autoCropArea: 0.8, // 默认裁剪区域占图片 80%
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      background: true,
      center: true,
      guides: true,
    });
  };

  img.src = imageUrl;
}

/** 弹窗打开时初始化裁剪器 */
watch(
  () => props.show,
  (val) => {
    if (!val || !props.file) return;

    const url = URL.createObjectURL(props.file);

    nextTick(() => {
      initCropper(url);
    });
  },
);
</script>

<template>
  <n-modal
    :show="show"
    title="裁剪头像"
    preset="card"
    style="width: 640px"
    :mask-closable="false"
    @update:show="handleCancel"
  >
    <div ref="containerRef" class="cropper-container" />
    <template #footer>
      <n-space justify="end">
        <n-button @click="handleCancel">取消</n-button>
        <n-button type="primary" @click="handleConfirm">确认裁剪</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>
.cropper-container {
  width: 100%;
  min-height: 360px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}
</style>
