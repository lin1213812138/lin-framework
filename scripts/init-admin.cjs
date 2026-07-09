#!/usr/bin/env node
/**
 * 初始化超级管理员账号
 *
 * 用于生产环境首次部署后创建默认管理员。
 * 在 deploy.sh 中自动通过 docker exec 在 server 容器内执行。
 *
 * 依赖: mongodb (mongoose 的子依赖), bcrypt
 * 运行: node scripts/init-admin.cjs
 */
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const ADMIN_USERNAME = 'LINFLY';
const ADMIN_PASSWORD = 'lx19980409';

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:20010/lin_framework';
  console.log(`[seed] 连接数据库: ${uri.replace(/\/\/.*@/, '//***@')}`);

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const users = db.collection('users');

  // 检查是否已存在
  const existing = await users.findOne({ username: ADMIN_USERNAME });
  if (existing) {
    console.log('[seed] ✅ 超级管理员已存在，跳过创建');
    await client.close();
    return;
  }

  // 检查 super_admin 角色是否存在
  const roles = db.collection('roles');
  const adminRole = await roles.findOne({ code: 'super_admin' });
  if (!adminRole) {
    console.warn('[seed] ⚠️ 未找到 super_admin 角色，将创建用户但可能无法正常登录');
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const now = Date.now();

  await users.insertOne({
    username: ADMIN_USERNAME,
    password: hashedPassword,
    nickname: '超级管理员',
    email: '',
    avatar: '',
    role: 'super_admin',
    permissions: [],
    status: 1,
    loginAttempts: 0,
    creator: 'system',
    creatorId: 'system',
    updater: 'system',
    updaterId: 'system',
    createDate: now,
    updateDate: now,
    isDeleted: false,
  });

  console.log('[seed] ✅ 超级管理员创建成功');
  console.log(`[seed]    账号: ${ADMIN_USERNAME}`);
  console.log(`[seed]    密码: ${ADMIN_PASSWORD}`);

  await client.close();
}

main().catch((err) => {
  console.error('[seed] ❌ 失败:', err.message);
  process.exit(1);
});