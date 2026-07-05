/*
 * @Author: 林翔 2276928094@qq.com
 * @Date: 2026-07-05 17:11:23
 * @LastEditors: 林翔 2276928094@qq.com
 * @LastEditTime: 2026-07-05 17:12:31
 * @FilePath: \lin-framework\apps\server\src\infrastructure\storage\local-storage.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, createReadStream } from 'node:fs';
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import {
  type StorageDriver,
  type StoredFileInfo,
} from '@/infrastructure/storage/storage.interface';

/**
 * 本地磁盘存储驱动
 *
 * 文件保存路径: {STORAGE_PATH}/{YYYY}/{MM}/{DD}/{uuid}{ext}
 * 例如: ./uploads/2026/03/15/550e8400-e29b-41d4-a716-446655440000.jpg
 */
@Injectable()
export class LocalStorageDriver implements StorageDriver {
  private readonly logger = new Logger(LocalStorageDriver.name);
  private readonly storagePath: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.storagePath =
      this.configService.get<string>('storage.path') ?? './uploads';
    this.baseUrl = '/api/v1/files/download';

    if (!existsSync(this.storagePath)) {
      mkdirSync(this.storagePath, { recursive: true });
    }
    this.logger.log(`Local storage initialized at ${this.storagePath}`);
  }

  async upload(
    buffer: Buffer,
    options: { originalName: string; mimeType: string; extension: string },
  ): Promise<StoredFileInfo> {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const dateDir = join(year, month, day);
    const fullDir = join(this.storagePath, dateDir);

    if (!existsSync(fullDir)) {
      mkdirSync(fullDir, { recursive: true });
    }

    const storedName = `${uuidv4()}${options.extension}`;
    const filePath = join(dateDir, storedName);
    const fullPath = join(this.storagePath, filePath);

    await writeFile(fullPath, buffer);

    return {
      storedName,
      path: filePath,
      url: `${this.baseUrl}/${storedName}`,
    };
  }

  async delete(path: string): Promise<void> {
    const fullPath = join(this.storagePath, path);
    try {
      await unlink(fullPath);
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to delete file: ${fullPath}`,
        (error as Error).message,
      );
    }
  }

  getStream(path: string): Promise<NodeJS.ReadableStream> {
    const fullPath = join(this.storagePath, path);

    if (!existsSync(fullPath)) {
      throw new NotFoundException('文件不存在或已被删除');
    }

    return Promise.resolve(createReadStream(fullPath));
  }
}
