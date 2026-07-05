import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { ErrorCodes } from '@/core/constants';
import { RoleRepository } from '@/modules/role/repositories/role.repository';
import { QueryRoleDto } from '@/modules/role/dtos/query-role.dto';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(private readonly roleRepository: RoleRepository) {}

  async findAll(query: QueryRoleDto) {
    return this.roleRepository.findAll(query);
  }

  async findAllRaw() {
    return this.roleRepository.findAllRaw();
  }

  async findById(id: string) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException(ErrorCodes.NOT_FOUND);
    }
    return role;
  }

  async create(
    data: { name: string; code: string; description?: string },
    userId: string,
    username: string,
  ) {
    const existing = await this.roleRepository.findByCode(data.code);
    if (existing) {
      throw new ConflictException(ErrorCodes.USER_ALREADY_EXISTS);
    }
    const now = Date.now();
    return this.roleRepository.create({
      ...data,
      creator: username,
      creatorId: userId,
      updater: username,
      updaterId: userId,
      createDate: now,
      updateDate: now,
    });
  }

  async update(
    id: string,
    data: { name?: string; description?: string; status?: number },
    userId: string,
    username: string,
  ) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException(ErrorCodes.NOT_FOUND);
    }
    return this.roleRepository.update(id, {
      ...data,
      updater: username,
      updaterId: userId,
      updateDate: Date.now(),
    });
  }

  async remove(id: string) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException(ErrorCodes.NOT_FOUND);
    }
    return this.roleRepository.remove(id);
  }

  async bindPermissions(id: string, permissionCodes: string[]) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException(ErrorCodes.NOT_FOUND);
    }
    return this.roleRepository.bindPermissions(id, permissionCodes);
  }

  async getPermissionCodes(id: string) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException(ErrorCodes.NOT_FOUND);
    }
    return this.roleRepository.getPermissionCodes(id);
  }
}
