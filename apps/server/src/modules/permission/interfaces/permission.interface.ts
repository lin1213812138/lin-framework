import type { Permission } from '@/modules/permission/schemas/permission.schema';

/** 权限树节点（按 module 分组） */
export interface PermissionTreeNode {
  module: string;
  children: Permission[];
}

/** IPermissionService 接口定义 */
export interface IPermissionService {
  /** 分页查询权限列表 */
  findAll(query: {
    keyword?: string;
    module?: string;
    page: number;
    limit: number;
  }): Promise<{
    data: Permission[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  /** 获取权限树（按 module 分组） */
  getTree(): Promise<PermissionTreeNode[]>;

  /** 同步内置权限到数据库 */
  syncBuiltin(): Promise<void>;
}
