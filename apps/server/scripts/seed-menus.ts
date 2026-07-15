/**
 * 菜单种子数据脚本
 *
 * 向菜单集合插入系统管理目录及其子菜单。
 * 已存在时跳过，不会重复创建。
 *
 * 用法：npx tsx apps/server/scripts/seed-menus.ts
 */
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/lin-framework';

// 只定义脚本需要的字段，复用集合名 'menus'
const MenuSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    name: { type: String, trim: true },
    path: { type: String, trim: true },
    routeName: { type: String, trim: true },
    component: { type: String, trim: true },
    redirect: { type: String, trim: true },
    icon: { type: String, trim: true },
    linkUrl: { type: String, trim: true },
    parentId: { type: String, default: null, index: true },
    permission: { type: String, trim: true },
    sort: { type: Number, default: 0 },
    type: { type: String, required: true },
    isLink: { type: Number, default: 0 },
    isHidden: { type: Number, default: 0 },
    isAffix: { type: Number, default: 0 },
    keepAlive: { type: Number, default: 0 },
    isIframe: { type: Number, default: 0 },
    status: { type: Number, default: 1 },
    creator: { type: String, default: 'system' },
    creatorId: { type: String, default: 'system' },
    updater: { type: String, default: 'system' },
    updaterId: { type: String, default: 'system' },
    createDate: { type: Number, default: () => Date.now() },
    updateDate: { type: Number, default: () => Date.now() },
    isDeleted: { type: Boolean, default: false },
  },
  { collection: 'menus', timestamps: false },
);

const MenuModel = mongoose.model('Menu', MenuSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('已连接 MongoDB:', MONGODB_URI);

  // 1. 创建或查找"系统管理"目录
  let sysDir = await MenuModel.findOne({
    name: '系统管理',
    type: 'dir',
    isDeleted: false,
  });

  if (!sysDir) {
    sysDir = await MenuModel.create({
      name: '系统管理',
      type: 'dir',
      icon: 'settings',
      sort: 1,
      parentId: null,
      status: 1,
    });
    console.log('✅ 创建目录: 系统管理 (id:', sysDir._id, ')');
  } else {
    console.log('ℹ️ 跳过: 系统管理 已存在 (id:', sysDir._id, ')');
  }

  // 2. 创建或查找"菜单管理"子菜单
  const existingMenuMgmt = await MenuModel.findOne({
    name: '菜单管理',
    type: 'menu',
    parentId: sysDir._id,
    isDeleted: false,
  });

  if (!existingMenuMgmt) {
    await MenuModel.create({
      name: '菜单管理',
      type: 'menu',
      path: '/system/menu',
      routeName: 'Menu',
      component: '@/views/system/menu/index.vue',
      icon: 'menu',
      permission: 'menu:read',
      sort: 0,
      parentId: sysDir._id,
      status: 1,
      isAffix: 0,
      keepAlive: 1,
    });
    console.log('✅ 创建菜单: 菜单管理 (父级: 系统管理)');
  } else {
    console.log('ℹ️ 跳过: 菜单管理 已存在');
  }

  await mongoose.disconnect();
  console.log('完成，已断开连接');
}

seed().catch((err) => {
  console.error('种子脚本失败:', err);
  process.exit(1);
});
