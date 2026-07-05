import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Permission,
  type PermissionDocument,
} from '@/modules/permission/schemas/permission.schema';

type FilterQuery = Record<string, unknown>;

@Injectable()
export class PermissionRepository {
  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  /** 分页查询 */
  async findAll(query: {
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
  }> {
    const { keyword, module: moduleFilter, page, limit } = query;
    const filter: FilterQuery = {};

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (moduleFilter) {
      filter.module = moduleFilter;
    }

    const [data, total] = await Promise.all([
      this.permissionModel
        .find(filter)
        .sort({ module: 1, code: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.permissionModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** 获取全部权限 */
  async findAllRaw(): Promise<Permission[]> {
    return this.permissionModel.find().sort({ module: 1, code: 1 }).lean();
  }

  /** 按 code 查找 */
  async findByCode(code: string): Promise<Permission | null> {
    return this.permissionModel.findOne({ code }).lean();
  }

  /** 批量插入（跳过已存在） */
  async bulkUpsert(
    permissions: Array<{
      name: string;
      code: string;
      module: string;
      description?: string;
    }>,
  ): Promise<void> {
    for (const perm of permissions) {
      await this.permissionModel.updateOne(
        { code: perm.code },
        { $setOnInsert: perm },
        { upsert: true },
      );
    }
  }

  /** 删除 */
  async remove(id: string): Promise<boolean> {
    const result = await this.permissionModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  /** 按 code 列表查询（用于角色绑定校验） */
  async findByCodes(codes: string[]): Promise<Permission[]> {
    return this.permissionModel.find({ code: { $in: codes } }).lean();
  }
}
