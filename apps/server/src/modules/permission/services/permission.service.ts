import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { PermissionRepository } from '@/modules/permission/repositories/permission.repository';
import { BUILTIN_PERMISSIONS } from '@/modules/permission/constants/permission.constant';
import type { PermissionTreeNode } from '@/modules/permission/interfaces/permission.interface';

@Injectable()
export class PermissionService implements OnModuleInit {
  private readonly logger = new Logger(PermissionService.name);

  constructor(private readonly permissionRepository: PermissionRepository) {}

  /** 模块初始化时自动注册内置权限 */
  async onModuleInit(): Promise<void> {
    await this.syncBuiltin();
    this.logger.log(`已同步 ${BUILTIN_PERMISSIONS.length} 个内置权限`);
  }

  /** 分页查询 */
  async findAll(query: {
    keyword?: string;
    module?: string;
    page: number;
    limit: number;
  }) {
    return this.permissionRepository.findAll(query);
  }

  /** 获取权限树（按 module 分组） */
  async getTree(): Promise<PermissionTreeNode[]> {
    const all = await this.permissionRepository.findAllRaw();
    const groupMap = new Map<string, typeof all>();

    for (const perm of all) {
      const group = groupMap.get(perm.module) ?? [];
      group.push(perm);
      groupMap.set(perm.module, group);
    }

    return Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, children]) => ({ module, children }));
  }

  /** 同步内置权限 */
  async syncBuiltin(): Promise<void> {
    await this.permissionRepository.bulkUpsert(
      BUILTIN_PERMISSIONS as unknown as Array<{
        name: string;
        code: string;
        module: string;
        description?: string;
      }>,
    );
  }

  /** 删除权限 */
  async remove(id: string): Promise<boolean> {
    return this.permissionRepository.remove(id);
  }
}
