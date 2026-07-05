import { request } from './index';
import type { ApiResponse, PaginatedResult } from '@/types/api';

export interface RoleInfo {
  _id: string;
  name: string;
  code: string;
  description?: string;
  permissions: string[];
  status: number;
  createDate: number;
}

/** 获取角色列表（分页） */
export function getRoles(params: {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: number;
}) {
  return request.get<ApiResponse<PaginatedResult<RoleInfo>>>('/roles', { params });
}

/** 获取全部角色 */
export function getAllRoles() {
  return request.get<ApiResponse<RoleInfo[]>>('/roles/all');
}

/** 获取角色详情 */
export function getRole(id: string) {
  return request.get<ApiResponse<RoleInfo>>(`/roles/${id}`);
}

/** 创建角色 */
export function createRole(data: { name: string; code: string; description?: string }) {
  return request.post<ApiResponse<RoleInfo>>('/roles', data);
}

/** 更新角色 */
export function updateRole(
  id: string,
  data: { name?: string; description?: string; status?: number },
) {
  return request.patch<ApiResponse<RoleInfo>>(`/roles/${id}`, data);
}

/** 删除角色 */
export function deleteRole(id: string) {
  return request.delete<ApiResponse<{ deleted: boolean }>>(`/roles/${id}`);
}

/** 绑定权限到角色 */
export function bindRolePermissions(id: string, permissionCodes: string[]) {
  return request.post<ApiResponse<RoleInfo>>(`/roles/${id}/permissions`, { permissionCodes });
}

/** 获取角色的权限编码列表 */
export function getRolePermissions(id: string) {
  return request.get<ApiResponse<string[]>>(`/roles/${id}/permissions`);
}
