import type { RouteRecordRaw } from 'vue-router';

/**
 * 路由配置表
 *
 * 按功能分组：
 *   - / (布局) → 所有业务页面作为子路由
 *   - /login, /register → 独立页面（无布局）
 *   - /:pathMatch(.*)* → 404 兜底
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/index.vue'),
    children: [
      {
        path: '',
        redirect: '/dashboard/console',
      },
      {
        path: 'dashboard',
        children: [
          {
            path: 'console',
            name: 'Console',
            component: () => import('@/views/dashboard/console/index.vue'),
            meta: { title: '控制台' },
          },
          {
            path: 'workbench',
            name: 'Workbench',
            component: () => import('@/views/dashboard/workbench/index.vue'),
            meta: { title: '工作台' },
          },
          {
            path: 'analysis',
            name: 'Analysis',
            component: () => import('@/views/dashboard/analysis/index.vue'),
            meta: { title: '分析页' },
          },
        ],
      },
      {
        path: 'system',
        children: [
          {
            path: 'user',
            name: 'User',
            component: () => import('@/views/system/user/index.vue'),
            meta: { title: '用户管理', permission: 'user:read' },
          },
          {
            path: 'role',
            name: 'Role',
            component: () => import('@/views/system/role/index.vue'),
            meta: { title: '角色管理', permission: 'role:read' },
          },
          {
            path: 'menu',
            name: 'Menu',
            component: () => import('@/views/system/menu/index.vue'),
            meta: { title: '菜单管理', permission: 'menu:read' },
          },
        ],
      },
      {
        path: 'permissions',
        name: 'Permission',
        component: () => import('@/views/permission/index.vue'),
        meta: { title: '权限管理', permission: 'permission:read' },
      },
      {
        path: 'files',
        name: 'File',
        component: () => import('@/views/file/index.vue'),
        meta: { title: '文件管理', permission: 'file:read' },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/login/register.vue'),
    meta: { title: '注册' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404' },
  },
];

export default routes;
