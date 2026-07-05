import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  FileEntity,
  type FileDocument,
} from '@/modules/file/schemas/file.schema';
import type { QueryFileDto } from '@/modules/file/dtos/query-file.dto';

@Injectable()
export class FileRepository {
  constructor(
    @InjectModel(FileEntity.name)
    private readonly fileModel: Model<FileDocument>,
  ) {}

  async findAll(query: QueryFileDto): Promise<{
    data: FileEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { keyword, status, page, limit } = query;
    const filter: Record<string, unknown> = { isDeleted: { $ne: true } };

    if (keyword) {
      filter.originalName = { $regex: keyword, $options: 'i' };
    }

    if (status !== undefined) {
      filter.status = status;
    }

    const [data, total] = await Promise.all([
      this.fileModel
        .find(filter)
        .sort({ createDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.fileModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<FileEntity | null> {
    return this.fileModel.findById(id).lean();
  }

  async create(data: Partial<FileEntity>): Promise<FileEntity> {
    const file = new this.fileModel(data);
    return file.save();
  }

  async update(
    id: string,
    data: Partial<
      Pick<FileEntity, 'status' | 'updater' | 'updaterId' | 'updateDate'>
    >,
  ): Promise<FileEntity | null> {
    return this.fileModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean();
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.fileModel.updateOne(
      { _id: id },
      { $set: { isDeleted: true, deletedAt: Date.now() } },
    );
    return result.modifiedCount > 0;
  }
}
