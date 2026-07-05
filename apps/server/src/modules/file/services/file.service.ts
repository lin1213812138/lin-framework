import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { imageSize } from 'image-size';
import { extname } from 'node:path';

import { STORAGE_TOKEN, type StorageDriver } from '@/infrastructure/storage';
import { FileRepository } from '@/modules/file/repositories/file.repository';
import { QueryFileDto } from '@/modules/file/dtos/query-file.dto';

/** 允许上传的 MIME 类型 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
];

/** 最大文件大小：10MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @Inject(STORAGE_TOKEN)
    private readonly storageDriver: StorageDriver,
    private readonly fileRepository: FileRepository,
    private readonly configService: ConfigService,
  ) {}

  async upload(file: Express.Multer.File, userId: string, username: string) {
    this.validateFile(file);

    // Multer 解析 Content-Disposition 时使用 latin1 编码，中文文件名会乱码
    const originalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    const extension = extname(originalName).toLowerCase();
    const now = Date.now();

    const stored = await this.storageDriver.upload(file.buffer, {
      originalName,
      mimeType: file.mimetype,
      extension,
    });

    // 提取图片宽高
    let width: number | undefined;
    let height: number | undefined;
    try {
      const dimensions = imageSize(file.buffer);
      width = dimensions.width;
      height = dimensions.height;
    } catch {
      // 非图片文件，静默忽略
    }

    return this.fileRepository.create({
      originalName,
      storedName: stored.storedName,
      mimeType: file.mimetype,
      size: file.size,
      extension,
      path: stored.path,
      url: stored.url,
      driver: 'local',
      width,
      height,
      creator: username,
      creatorId: userId,
      updater: username,
      updaterId: userId,
      createDate: now,
      updateDate: now,
    });
  }

  async findAll(query: QueryFileDto) {
    return this.fileRepository.findAll(query);
  }

  async findById(id: string) {
    const file = await this.fileRepository.findById(id);
    if (!file) {
      throw new NotFoundException('文件不存在');
    }
    return file;
  }

  async download(id: string) {
    const file = await this.findById(id);
    const stream = await this.storageDriver.getStream(file.path);
    return { stream, file };
  }

  async remove(id: string) {
    const file = await this.findById(id);

    // 先删除存储，再删除数据库记录
    await this.storageDriver.delete(file.path);
    await this.fileRepository.softDelete(id);

    return { deleted: true };
  }

  private validateFile(file: Express.Multer.File): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException('文件大小不能超过 10MB');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`不支持的文件类型: ${file.mimetype}`);
    }
  }
}
