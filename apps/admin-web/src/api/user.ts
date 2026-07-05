import { request } from './index';
import type { ApiResponse, PaginatedResult } from '@/types/api';
import type { UserInfo } from '@/types/api';

/** 获取用户列表（分页） */
export function getUsers(params: {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
}) {
  return request.get<ApiResponse<PaginatedResult<UserInfo>>>('/users', { params });
}

/** 创建用户 */
export function createUser(data: {
  username: string;
  password: string;
  nickname?: string;
  email?: string;
  avatar?: string;
  role?: string;
  status?: number;
}) {
  return request.post<ApiResponse<UserInfo>>('/users', data);
}

/** 获取用户详情 */
export function getUser(id: string) {
  return request.get<ApiResponse<UserInfo>>(`/users/${id}`);
}

/** 更新用户信息 */
export function updateUser(
  id: string,
  data: {
    nickname?: string;
    email?: string;
    avatar?: string;
    status?: number;
    role?: string;
  },
) {
  return request.patch<ApiResponse<UserInfo>>(`/users/${id}`, data);
}

/** 切换用户状态 */
export function toggleUserStatus(id: string) {
  return request.patch<ApiResponse<UserInfo>>(`/users/${id}/status`);
}

/** 删除用户 */
export function deleteUser(id: string) {
  return request.delete<ApiResponse<{ deleted: boolean }>>(`/users/${id}`);
}
