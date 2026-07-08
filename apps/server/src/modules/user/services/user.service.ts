import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { ErrorCodes } from '@/core/constants';
import { UserRepository } from '@/modules/user/repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAll(query: {
    keyword?: string;
    status?: number;
    role?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
  }) {
    return this.userRepository.findAll(query);
  }

  async create(
    data: {
      username: string;
      password: string;
      nickname?: string;
      email?: string;
      avatar?: string;
      role?: string;
      status?: number;
    },
    userId: string,
    username: string,
  ) {
    const existingUser = await this.userRepository.findByUsername(
      data.username,
    );
    if (existingUser) {
      throw new ConflictException(ErrorCodes.USER_ALREADY_EXISTS);
    }
    if (data.email) {
      const existingEmail = await this.userRepository.findByEmail(data.email);
      if (existingEmail) {
        throw new ConflictException(ErrorCodes.USER_ALREADY_EXISTS);
      }
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const now = Date.now();
    return this.userRepository.create({
      ...data,
      password: hashedPassword,
      creator: username,
      creatorId: userId,
      updater: username,
      updaterId: userId,
      createDate: now,
      updateDate: now,
    });
  }

  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(ErrorCodes.NOT_FOUND);
    }
    return user;
  }

  async update(
    id: string,
    data: {
      nickname?: string;
      email?: string;
      avatar?: string;
      status?: number;
      role?: string;
    },
  ) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(ErrorCodes.NOT_FOUND);
    }
    if (data.email && data.email !== user.email) {
      const existingEmail = await this.userRepository.findByEmail(data.email);
      if (existingEmail) {
        throw new ConflictException(ErrorCodes.EMAIL_ALREADY_EXISTS);
      }
    }
    return this.userRepository.update(id, data);
  }

  async remove(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(ErrorCodes.NOT_FOUND);
    }
    return this.userRepository.softDelete(id);
  }

  async toggleStatus(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(ErrorCodes.NOT_FOUND);
    }

    const newStatus = user.status === 1 ? 0 : 1;
    return this.userRepository.update(id, { status: newStatus });
  }
}
