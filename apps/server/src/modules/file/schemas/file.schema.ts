import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

import { BaseEntity, applyBaseHooks } from '@/shared/database';

export type FileDocument = HydratedDocument<FileEntity>;

/**
 * 文件实体
 *
 * 记录上传文件的元数据，实际二进制内容由 StorageDriver 管理。
 */
@Schema({ _id: false, timestamps: false, collection: 'files' })
export class FileEntity extends BaseEntity {
  /** 用户原始文件名 */
  @Prop({ required: true })
  originalName: string;

  /** UUID 存储文件名 */
  @Prop({ required: true })
  storedName: string;

  /** MIME 类型 */
  @Prop({ required: true })
  mimeType: string;

  /** 文件大小（字节） */
  @Prop({ required: true })
  size: number;

  /** 文件扩展名，如 .jpg / .pdf */
  @Prop({ required: true })
  extension: string;

  /** 存储相对路径，如 2026/03/15/uuid.ext */
  @Prop({ required: true })
  path: string;

  /** 下载 URL */
  @Prop({ required: true })
  url: string;

  /** 存储驱动类型：local / s3 / oss */
  @Prop({ default: 'local' })
  driver: string;

  /** 图片宽度（图片文件适用） */
  @Prop({ type: Number })
  width?: number;

  /** 图片高度（图片文件适用） */
  @Prop({ type: Number })
  height?: number;

  /** 状态：1-启用 / 0-禁用 */
  @Prop({ default: 1, type: Number })
  status: number;
}

export const FileEntitySchema = SchemaFactory.createForClass(FileEntity);

applyBaseHooks(FileEntitySchema);
