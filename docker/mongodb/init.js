/**
 * MongoDB 初始化脚本
 *
 * 在容器首次启动时自动执行，创建应用所需的数据库和初始集合。
 *
 * @usage 被 docker-compose.yml volumes 挂载到 /docker-entrypoint-initdb.d/
 */

// 切换到应用数据库
db = db.getSiblingDB('lin_framework');

// 创建核心集合及索引
// users 集合
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ is_deleted: 1, created_at: -1 });

// roles 集合
db.createCollection('roles');
db.roles.createIndex({ code: 1 }, { unique: true });
db.roles.createIndex({ is_deleted: 1 });

// permissions 集合
db.createCollection('permissions');
db.permissions.createIndex({ code: 1 }, { unique: true });

// menus 集合
db.createCollection('menus');
db.menus.createIndex({ parent_id: 1 });
db.menus.createIndex({ permission: 1 }, { sparse: true });

// user_roles 集合
db.createCollection('user_roles');
db.user_roles.createIndex({ user_id: 1, role_id: 1 }, { unique: true });
db.user_roles.createIndex({ role_id: 1 });

// role_permissions 集合
db.createCollection('role_permissions');
db.role_permissions.createIndex({ role_id: 1, permission_id: 1 }, { unique: true });
db.role_permissions.createIndex({ permission_id: 1 });

// operation_logs 集合（带 TTL 索引，保留 90 天）
db.createCollection('operation_logs');
db.operation_logs.createIndex({ created_at: -1 });
db.operation_logs.createIndex({ user_id: 1, created_at: -1 });
db.operation_logs.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);

// 插入初始超级管理员角色
db.roles.insertOne({
  _id: '00000000-0000-0000-0000-000000000001',
  code: 'super_admin',
  name: '超级管理员',
  description: '系统超级管理员，拥有所有权限',
  is_deleted: false,
  created_at: new Date(),
  updated_at: new Date(),
});

// 创建 admin 数据库用于管理
db = db.getSiblingDB('admin');

// 创建应用数据库用户（如需要在认证模式下使用）
// db.createUser({
//   user: 'lin_app',
//   pwd: 'lin_app_password',
//   roles: [{ role: 'readWrite', db: 'lin_framework' }],
// });
