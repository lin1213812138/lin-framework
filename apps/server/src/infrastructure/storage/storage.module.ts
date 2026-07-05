import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { STORAGE_TOKEN } from '@/infrastructure/storage/storage.interface';
import { LocalStorageDriver } from '@/infrastructure/storage/local-storage';

/**
 * 存储模块
 *
 * 注册 StorageDriver 实现到 DI 容器。后续扩展 S3/OSS 驱动只需:
 * 1. 新建 XxxStorageDriver implements StorageDriver
 * 2. 在此处将 useClass 替换为 XxxStorageDriver
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STORAGE_TOKEN,
      useClass: LocalStorageDriver,
    },
  ],
  exports: [STORAGE_TOKEN],
})
export class StorageModule {}
