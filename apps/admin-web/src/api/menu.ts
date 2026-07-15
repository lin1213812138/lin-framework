import { request } from './index';
import type { ApiResponse } from '@/types/api';

export interface MenuInfo {
  _id: string;
  name: string;
  routeName?: string;
  path?: string;
  component?: string;
  redirect?: string;
  icon?: string;
  linkUrl?: string;
  parentId: string | null;
  permission?: string;
  sort: number;
  type: string;
  status: number;
  isLink: number;
  isHidden: number;
  isAffix: number;
  isAlwaysShow: number;
  keepAlive: number;
  isIframe: number;
  createDate: number;
}

export interface MenuTreeNode extends MenuInfo {
  children: MenuTreeNode[];
}

/** 获取菜单树 */
export function getMenuTree() {
  return request.get<ApiResponse<MenuTreeNode[]>>('/menus');
}

/** 获取当前用户的菜单树 */
export function getUserMenus() {
  return request.get<ApiResponse<MenuTreeNode[]>>('/menus/user/menus');
}

/** 获取菜单详情 */
export function getMenu(id: string) {
  return request.get<ApiResponse<MenuInfo>>(`/menus/${id}`);
}

/** 创建菜单 */
export function createMenu(data: {
  name: string;
  routeName?: string;
  path?: string;
  component?: string;
  redirect?: string;
  icon?: string;
  linkUrl?: string;
  parentId?: string | null;
  permission?: string;
  sort?: number;
  type: string;
  isLink?: number;
  isHidden?: number;
  isAffix?: number;
  isAlwaysShow?: number;
  keepAlive?: number;
  isIframe?: number;
}) {
  return request.post<ApiResponse<MenuInfo>>('/menus', data);
}

/** 更新菜单 */
export function updateMenu(
  id: string,
  data: {
    name?: string;
    routeName?: string;
    path?: string;
    component?: string;
    redirect?: string;
    icon?: string;
    linkUrl?: string;
    parentId?: string | null;
    permission?: string;
    sort?: number;
    type?: string;
    status?: number;
    isLink?: number;
    isHidden?: number;
    isAffix?: number;
    isAlwaysShow?: number;
    keepAlive?: number;
    isIframe?: number;
  },
) {
  return request.patch<ApiResponse<MenuInfo>>(`/menus/${id}`, data);
}

/** 删除菜单 */
export function deleteMenu(id: string) {
  return request.delete<ApiResponse<{ deleted: boolean }>>(`/menus/${id}`);
}
