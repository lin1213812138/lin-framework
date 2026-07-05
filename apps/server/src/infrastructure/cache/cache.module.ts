import { Module } from '@nestjs/common';
import { RedisModule } from '@/infrastructure/database/redis/redis.module';
import { CACHE_TOKEN } from '@/infrastructure/cache/cache.interface';
import { RedisCacheDriver } from '@/infrastructure/cache/redis-cache';

/**
 * 缓存模块
 *
 * 注册 CacheDriver 实现到 DI 容器。
 * 后续可扩展 InMemoryCacheDriver / MemcachedDriver 等实现。
 */
@Module({
  imports: [RedisModule],
  providers: [
    {
      provide: CACHE_TOKEN,
      useClass: RedisCacheDriver,
    },
  ],
  exports: [CACHE_TOKEN],
})
export class CacheModule {}
