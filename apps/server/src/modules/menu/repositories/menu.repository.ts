import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Menu, type MenuDocument } from '@/modules/menu/schemas/menu.schema';
@Injectable()
export class MenuRepository {
  constructor(
    @InjectModel(Menu.name) private readonly menuModel: Model<MenuDocument>,
  ) {}

  async findAll(): Promise<Menu[]> {
    return this.menuModel.find().sort({ sort: 1, createDate: 1 }).lean();
  }

  async findById(id: string): Promise<Menu | null> {
    return this.menuModel.findById(id).lean();
  }

  async create(data: Partial<Menu>): Promise<Menu> {
    const menu = new this.menuModel(data);
    return menu.save();
  }

  async update(id: string, data: Partial<Menu>): Promise<Menu | null> {
    return this.menuModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean();
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.menuModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  /** 查找指定 parentId 的所有子菜单（用于级联删除） */
  async findByParentId(parentId: string): Promise<Menu[]> {
    return this.menuModel.find({ parentId }).lean();
  }
}
