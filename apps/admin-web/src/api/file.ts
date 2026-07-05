import { request } from './index';
import type { ApiResponse, PaginatedResult } from '@/types/api';

export interface FileInfo {
  _id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  extension: string;
  url: string;
  driver: string;
  width?: number;
  height?: number;
  status: number;
  createDate: number;
  creator: string;
}

/** 获取文件列表（分页） */
export function getFiles(params: {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: number;
}) {
  return request.get<ApiResponse<PaginatedResult<FileInfo>>>('/files', {
    params,
  });
}

/** 获取文件详情 */
export function getFile(id: string) {
  return request.get<ApiResponse<FileInfo>>(`/files/${id}`);
}

/** 获取文件下载 URL（attachment，浏览器会下载） */
export function getFileDownloadUrl(id: string): string {
  return `/api/v1/files/${id}/download`;
}

/** 获取文件预览 URL（inline，浏览器直接显示图片） */
export function getFileViewUrl(id: string): string {
  return `/api/v1/files/${id}/view`;
}

/** 删除文件 */
export function deleteFile(id: string) {
  return request.delete<ApiResponse<{ deleted: boolean }>>(`/files/${id}`);
}

/** 格式化文件大小 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * 上传文件（供 NUpload 的 custom-request 使用）
 * 也可以直接用 NUpload 的 action 属性指向 /api/v1/files/upload
 */
export function uploadFile(file: File, onProgress?: (percent: number) => void): Promise<FileInfo> {
  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/v1/files/upload');

    const token = localStorage.getItem('accessToken');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText) as ApiResponse<FileInfo>;
        resolve(response.data);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(formData);
  });
}
