import type { UserStatus } from '@/constants/user';

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
  requestId: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface UserInfo {
  _id: string;
  username: string;
  nickname: string;
  email: string;
  avatar: string;
  status: UserStatus;
  role: string;
  roles: string[];
  permissions: string[];
  createDate: number;
  updateDate: number;
}

export interface MenuItem {
  _id: string;
  name: string;
  path: string;
  icon: string;
  parentId: string | null;
  permission: string;
  sort: number;
  children: MenuItem[];
}
