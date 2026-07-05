import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { BusinessException, ConflictException } from '@/core/exception';
import { ErrorCodes } from '@/core/constants';
import { RedisService } from '@/infrastructure/database/redis/redis.service';

import type { RegisterDto } from '@/modules/auth/dtos/register.dto';
import type { LoginDto } from '@/modules/auth/dtos/login.dto';
import type {
  TokenResponse,
  JwtPayload,
} from '@/modules/auth/interfaces/auth.interface';
import type { User } from '@/modules/auth/schemas/user.schema';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { CaptchaService } from '@/modules/auth/services/captcha.service';
import {
  REFRESH_TOKEN_PREFIX,
  BLACKLIST_PREFIX,
  LOCK_PREFIX,
  MAX_LOGIN_ATTEMPTS,
  LOCK_DURATION_MS,
} from '@/modules/auth/constants/auth.constant';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly captchaService: CaptchaService,
  ) {}

  /**
   * 用户注册
   *
   * 检查账号唯一性 → 密码 bcrypt 哈希 → 创建用户记录 → 返回令牌
   *
   * @param dto - 注册请求体
   * @returns accessToken + refreshToken
   * @throws ConflictException 账号已存在时抛出
   */
  async register(dto: RegisterDto): Promise<TokenResponse> {
    const existing = await this.userRepository.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException(ErrorCodes.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const now = Date.now();

    const user = await this.userRepository.create({
      username: dto.username,
      password: hashedPassword,
      nickname: dto.nickname,
      creator: dto.username,
      creatorId: 'system',
      updater: dto.username,
      updaterId: 'system',
      createDate: now,
      updateDate: now,
    });

    return this.generateTokens(user.id, user.username, user.role);
  }

  /**
   * 用户登录
   *
   * 验证码校验 → 用户查找 → 状态检查 → 锁定检查 → 密码比对 →
   * 失败计数 / 成功生成令牌
   *
   * @param dto - 登录请求体
   * @returns accessToken + refreshToken
   * @throws BusinessException 验证码无效 / 用户不存在 / 密码错误时抛出
   */
  async login(dto: LoginDto): Promise<TokenResponse> {
    const valid = await this.captchaService.validate(
      dto.captchaId,
      dto.captcha,
    );
    if (!valid) {
      throw new BusinessException(ErrorCodes.CAPTCHA_INVALID);
    }

    const user = await this.userRepository.findByUsername(dto.username);
    if (!user) {
      throw new BusinessException(ErrorCodes.USER_NOT_FOUND);
    }

    if (user.status === 0) {
      throw new BusinessException(ErrorCodes.FORBIDDEN);
    }

    await this.checkLockStatus(user.id, dto.username);

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      await this.handleFailedAttempt(user.id, dto.username);
      throw new BusinessException(ErrorCodes.PASSWORD_INCORRECT);
    }

    await this.userRepository.resetLoginAttempts(user.id);

    return this.generateTokens(user.id, user.username, user.role);
  }

  async refresh(refreshToken: string): Promise<TokenResponse> {
    const redisKey = `${REFRESH_TOKEN_PREFIX}${refreshToken}`;
    const payload = await this.redisService.getClient().get(redisKey);

    if (!payload) {
      throw new BusinessException(ErrorCodes.TOKEN_INVALID);
    }

    const parsed = JSON.parse(payload) as {
      userId: string;
      username: string;
      role: string;
    };

    await this.redisService.getClient().del(redisKey);

    return this.generateTokens(parsed.userId, parsed.username, parsed.role);
  }

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    const redis = this.redisService.getClient();

    const refreshKey = `${REFRESH_TOKEN_PREFIX}${refreshToken}`;
    await redis.del(refreshKey);

    if (accessToken) {
      const decoded: unknown = this.jwtService.decode(accessToken);
      if (decoded && typeof decoded === 'object' && 'exp' in decoded) {
        const exp = Number((decoded as Record<string, unknown>).exp);
        const ttl = Math.max(0, exp - Math.floor(Date.now() / 1000));
        if (ttl > 0) {
          await redis.set(`${BLACKLIST_PREFIX}${accessToken}`, '1', 'EX', ttl);
        }
      }
    }
  }

  async getCaptcha(): Promise<{ id: string; svg: string }> {
    return this.captchaService.generate();
  }

  /** 获取当前登录用户信息（含头像等） */
  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findProfileById(userId);
    if (!user) {
      throw new BusinessException(ErrorCodes.USER_NOT_FOUND);
    }
    return user;
  }

  private async generateTokens(
    userId: string,
    username: string,
    role: string,
  ): Promise<TokenResponse> {
    const payload: JwtPayload = { sub: userId, username, role };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = uuidv4();
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES') ?? '7d';

    const ttlSeconds = this.parseTtlToSeconds(refreshExpiresIn);

    await this.redisService
      .getClient()
      .set(
        `${REFRESH_TOKEN_PREFIX}${refreshToken}`,
        JSON.stringify({ userId, username, role }),
        'EX',
        ttlSeconds,
      );

    return { accessToken, refreshToken };
  }

  /**
   * 检查账号是否被锁定
   *
   * 读取 Redis 中的失败尝试次数，达到上限则抛出锁定异常。
   *
   * @param userId   - 用户 ID
   * @param username - 用户名（用于 Redis Key）
   * @throws BusinessException 锁定次数达上限时抛出
   */
  private async checkLockStatus(
    userId: string,
    username: string,
  ): Promise<void> {
    const lockKey = `${LOCK_PREFIX}${username}`;
    const lockData = await this.redisService.getClient().get(lockKey);

    if (lockData) {
      const attempts = parseInt(lockData, 10);
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        throw new BusinessException(ErrorCodes.ACCOUNT_LOCKED);
      }
    }
  }

  private async handleFailedAttempt(
    userId: string,
    username: string,
  ): Promise<void> {
    const lockKey = `${LOCK_PREFIX}${username}`;
    const attempts = await this.redisService.getClient().incr(lockKey);

    if (attempts === 1) {
      await this.redisService
        .getClient()
        .expire(lockKey, LOCK_DURATION_MS / 1000);
    }

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await this.redisService
        .getClient()
        .expire(lockKey, LOCK_DURATION_MS / 1000);
    }

    await this.userRepository.updateLoginAttempts(userId, attempts);
  }

  private parseTtlToSeconds(expires: string): number {
    const match = expires.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 3600;

    const value = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 7 * 24 * 3600;
    }
  }
}
