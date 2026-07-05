/**
 * 内置权限列表
 *
 * code 命名规则：{module}:{action}
 * - module 表示所属业务模块
 * - action 表示具体操作，支持 * 通配符表示模块下所有操作
 */
export const BUILT_IN_PERMISSIONS = [
  // 用户管理
  {
    name: '创建用户',
    code: 'user:create',
    module: 'user',
    description: '创建新用户',
  },
  {
    name: '查询用户',
    code: 'user:read',
    module: 'user',
    description: '查询用户列表和详情',
  },
  {
    name: '更新用户',
    code: 'user:update',
    module: 'user',
    description: '编辑用户信息',
  },
  {
    name: '删除用户',
    code: 'user:delete',
    module: 'user',
    description: '删除用户',
  },

  // 角色管理
  {
    name: '创建角色',
    code: 'role:create',
    module: 'role',
    description: '创建新角色',
  },
  {
    name: '查询角色',
    code: 'role:read',
    module: 'role',
    description: '查询角色列表和详情',
  },
  {
    name: '更新角色',
    code: 'role:update',
    module: 'role',
    description: '编辑角色信息',
  },
  {
    name: '删除角色',
    code: 'role:delete',
    module: 'role',
    description: '删除角色',
  },

  // 权限管理
  {
    name: '查询权限',
    code: 'permission:read',
    module: 'permission',
    description: '查询权限列表',
  },
  {
    name: '同步权限',
    code: 'permission:sync',
    module: 'permission',
    description: '同步内置权限到数据库',
  },

  // 菜单管理
  {
    name: '创建菜单',
    code: 'menu:create',
    module: 'menu',
    description: '创建菜单或目录',
  },
  {
    name: '查询菜单',
    code: 'menu:read',
    module: 'menu',
    description: '查询菜单列表和详情',
  },
  {
    name: '更新菜单',
    code: 'menu:update',
    module: 'menu',
    description: '编辑菜单信息',
  },
  {
    name: '删除菜单',
    code: 'menu:delete',
    module: 'menu',
    description: '删除菜单',
  },

  // 系统管理
  {
    name: '系统管理',
    code: 'system:*',
    module: 'system',
    description: '系统管理全部权限',
  },
] as const;

export type BuiltInPermission = (typeof BUILT_IN_PERMISSIONS)[number];
