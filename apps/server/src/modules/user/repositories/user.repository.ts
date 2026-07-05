import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { UserDocument } from '@/modules/auth/schemas/user.schema';
import { User } from '@/modules/auth/schemas/user.schema';

type FilterQuery = Record<string, unknown>;

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /** 分页查询用户列表 */
  async findAll(query: {
    keyword?: string;
    status?: number;
    role?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
  }): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { keyword, status, role, startDate, endDate, page, limit } = query;
    const filter: FilterQuery = { isDeleted: false };

    if (keyword) {
      filter.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { nickname: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (role) {
      filter.role = role;
    }

    if (startDate || endDate) {
      const createDateFilter: Record<string, number> = {};
      if (startDate) createDateFilter.$gte = new Date(startDate).getTime();
      if (endDate) createDateFilter.$lte = new Date(endDate).getTime();
      filter.createDate = createDateFilter;
    }

    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password')
        .sort({ createDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** 按用户名查询 */
  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username, isDeleted: false }).exec();
  }

  /** 按邮箱查询 */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), isDeleted: false })
      .exec();
  }

  /** 按 ID 查询（排除密码字段） */
  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).select('-password').lean();
  }

  /** 更新用户信息 */
  async update(
    id: string,
    data: Partial<
      Pick<User, 'nickname' | 'email' | 'avatar' | 'status' | 'role'>
    >,
  ): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { ...data, updateDate: Date.now() } },
        { new: true },
      )
      .select('-password')
      .lean();
  }

  /** 创建用户 */
  async create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  /** 软删除用户 */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          isDeleted: true,
          deletedAt: Date.now(),
          updateDate: Date.now(),
        },
      },
    );
    return result.modifiedCount > 0;
  }
}
