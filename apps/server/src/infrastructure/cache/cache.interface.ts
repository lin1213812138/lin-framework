/** DI token for CacheDriver */
export const CACHE_TOKEN = 'CACHE_DRIVER';

/**
 * 缓存驱动接口
 *
 * 抽象缓存操作，支持 Redis / 内存等多种后端。
 * 业务模块通过此接口进行缓存存取，不关心底层实现。
 */
export interface CacheDriver {
  /** 获取缓存值 */
  get<T>(key: string): Promise<T | null>;

  /** 设置缓存值，可选的 TTL（毫秒） */
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;

  /** 删除缓存 */
  del(key: string): Promise<void>;

  /** 检查 key 是否存在 */
  has(key: string): Promise<boolean>;

  /** 清空所有缓存 */
  clear(): Promise<void>;
}
