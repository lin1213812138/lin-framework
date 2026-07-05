import { Injectable, Logger } from '@nestjs/common';
import { type CacheDriver } from '@/infrastructure/cache/cache.interface';
import { RedisService } from '@/infrastructure/database/redis/redis.service';

/**
 * Redis 缓存驱动
 *
 * 基于项目中已有的 RedisService 实现 CacheDriver 接口。
 * Redis 不可用时静默回退到无缓存（所有操作无副作用）。
 */
@Injectable()
export class RedisCacheDriver implements CacheDriver {
  private readonly logger = new Logger(RedisCacheDriver.name);

  constructor(private readonly redisService: RedisService) {}

  private isAvailable(): boolean {
    return this.redisService.isConnected();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;

    try {
      const raw = await this.redisService.getClient().get(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (error: unknown) {
      this.logger.warn(`Cache get error: ${(error as Error).message}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const serialized = JSON.stringify(value);
      if (ttlMs !== undefined) {
        await this.redisService.getClient().set(key, serialized, 'PX', ttlMs);
      } else {
        await this.redisService.getClient().set(key, serialized);
      }
    } catch (error: unknown) {
      this.logger.warn(`Cache set error: ${(error as Error).message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.redisService.getClient().del(key);
    } catch (error: unknown) {
      this.logger.warn(`Cache del error: ${(error as Error).message}`);
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const result = await this.redisService.getClient().exists(key);
      return result === 1;
    } catch (error: unknown) {
      this.logger.warn(`Cache has error: ${(error as Error).message}`);
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.redisService.getClient().flushdb();
    } catch (error: unknown) {
      this.logger.warn(`Cache clear error: ${(error as Error).message}`);
    }
  }
}
