import type { Role } from '@/modules/role/schemas/role.schema';

export interface IRoleService {
  findAll(query: {
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
  }>;

  findAllRaw(): Promise<Role[]>;

  findById(id: string): Promise<Role | null>;

  create(data: {
    name: string;
    code: string;
    description?: string;
  }): Promise<Role>;

  update(
    id: string,
    data: { name?: string; description?: string; status?: number },
  ): Promise<Role | null>;

  remove(id: string): Promise<boolean>;

  bindPermissions(id: string, permissionCodes: string[]): Promise<Role | null>;

  getPermissionCodes(id: string): Promise<string[]>;
}
