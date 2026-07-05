import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { UserDocument } from '@/modules/auth/schemas/user.schema';
import { User } from '@/modules/auth/schemas/user.schema';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username, isDeleted: false }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), isDeleted: false })
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /** 获取用户信息（排除密码字段） */
  async findProfileById(id: string): Promise<Partial<User> | null> {
    return this.userModel.findById(id).select('-password').lean();
  }

  /**
   * 根据角色编码查询关联用户数
   * @param roleCode 角色编码
   */
  async countByRole(roleCode: string): Promise<number> {
    return this.userModel
      .countDocuments({ role: roleCode, isDeleted: false })
      .exec();
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async updateLoginAttempts(
    id: string,
    attempts: number,
    lockUntil?: number,
  ): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: id },
        {
          $set: { loginAttempts: attempts, lockUntil, updateDate: Date.now() },
        },
      )
      .exec();
  }

  async resetLoginAttempts(id: string): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: id },
        {
          $set: { loginAttempts: 0, updateDate: Date.now() },
          $unset: { lockUntil: '' },
        },
      )
      .exec();
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: id },
        { $set: { password: hashedPassword, updateDate: Date.now() } },
      )
      .exec();
  }
}
