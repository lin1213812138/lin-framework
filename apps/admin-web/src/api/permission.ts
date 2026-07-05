import { request } from './index';
import type { ApiResponse, PaginatedResult } from '@/types/api';

export interface PermissionInfo {
  _id: string;
  name: string;
  code: string;
  description?: string;
  module: string;
  status: number;
  createDate: number;
}

export interface PermissionTreeNode {
  module: string;
  children: PermissionInfo[];
}

/** 获取权限列表（分页） */
export function getPermissions(params: {
  page?: number;
  limit?: number;
  keyword?: string;
  module?: string;
}) {
  return request.get<ApiResponse<PaginatedResult<PermissionInfo>>>('/permissions', { params });
}

/** 获取权限树 */
export function getPermissionTree() {
  return request.get<ApiResponse<PermissionTreeNode[]>>('/permissions/tree');
}

/** 同步内置权限 */
export function syncPermissions() {
  return request.post<ApiResponse<{ synced: boolean }>>('/permissions/sync');
}

/** 删除权限 */
export function deletePermission(id: string) {
  return request.delete<ApiResponse<{ deleted: boolean }>>(`/permissions/${id}`);
}
