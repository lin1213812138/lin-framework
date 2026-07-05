import type { User } from '@/modules/auth/schemas/user.schema';

export interface IUserService {
  create(
    data: {
      username: string;
      password: string;
      nickname?: string;
      email?: string;
      role?: string;
      status?: number;
    },
    userId: string,
    username: string,
  ): Promise<User>;

  findAll(query: {
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
  }>;

  findById(id: string): Promise<User | null>;

  update(
    id: string,
    data: Partial<
      Pick<User, 'nickname' | 'email' | 'avatar' | 'status' | 'role'>
    >,
  ): Promise<User | null>;

  remove(id: string): Promise<boolean>;

  toggleStatus(id: string): Promise<User | null>;
}
