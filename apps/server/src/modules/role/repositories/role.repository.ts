import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Role, type RoleDocument } from '@/modules/role/schemas/role.schema';

type FilterQuery = Record<string, unknown>;

@Injectable()
export class RoleRepository {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  async findAll(query: {
    keyword?: string;
    status?: number;
    page: number;
    limit: number;
  }): Promise<{
    data: Role[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { keyword, status, page, limit } = query;
    const filter: FilterQuery = {};

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (status !== undefined) {
      filter.status = status;
    }

    const [data, total] = await Promise.all([
      this.roleModel
        .find(filter)
        .sort({ createDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.roleModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllRaw(): Promise<Role[]> {
    return this.roleModel.find().sort({ createDate: -1 }).lean();
  }

  async findById(id: string): Promise<Role | null> {
    return this.roleModel.findById(id).lean();
  }

  async findByCode(code: string): Promise<Role | null> {
    return this.roleModel.findOne({ code }).lean();
  }

  async create(data: {
    name: string;
    code: string;
    description?: string;
    creator: string;
    creatorId: string;
    updater: string;
    updaterId: string;
    createDate: number;
    updateDate: number;
  }): Promise<Role> {
    const role = new this.roleModel(data);
    return role.save();
  }

  async update(
    id: string,
    data: Partial<
      Pick<
        Role,
        | 'name'
        | 'description'
        | 'status'
        | 'updater'
        | 'updaterId'
        | 'updateDate'
      >
    >,
  ): Promise<Role | null> {
    return this.roleModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean();
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.roleModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async bindPermissions(
    id: string,
    permissionCodes: string[],
  ): Promise<Role | null> {
    return this.roleModel
      .findByIdAndUpdate(
        id,
        { $set: { permissions: permissionCodes } },
        { new: true },
      )
      .lean();
  }

  async getPermissionCodes(id: string): Promise<string[]> {
    const role = await this.roleModel.findById(id).lean();
    return role?.permissions ?? [];
  }
}
