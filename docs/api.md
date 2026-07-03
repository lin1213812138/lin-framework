# API Design

> **设计依据**: AGENTS.md §9 接口规范、§12 错误处理规范
>
> 本文档描述 LIN Framework 的 API 设计规范、统一响应格式、认证鉴权机制以及所有业务接口定义。

---

## 1. 基础规范

### 1.1 API 版本

所有 API 以 `/api/v1/` 为前缀：

```
GET /api/v1/users
POST /api/v1/users
PATCH /api/v1/users/:id
DELETE /api/v1/users/:id
```

### 1.2 统一响应格式

依据 AGENTS.md §9.1，所有响应使用以下格式：

```typescript
interface ApiResponse<T = unknown> {
  code: number; // 业务状态码，0 表示成功
  message: string; // 提示信息
  data: T; // 响应数据
  timestamp: number; // Unix 时间戳
  requestId: string; // 请求追踪 ID（全链路追踪）
}
```

**成功响应示例**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "username": "admin",
    "email": "admin@example.com"
  },
  "timestamp": 1719504000000,
  "requestId": "req-abc123-def456"
}
```

**列表响应示例**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  },
  "timestamp": 1719504000000,
  "requestId": "req-abc123-def456"
}
```

### 1.3 统一异常格式

依据 AGENTS.md §9.2，异常响应使用以下格式：

```typescript
interface ApiError {
  code: number;
  message: string;
  timestamp: number;
  requestId: string;
  path: string;
}
```

**错误响应示例**：

```json
{
  "code": 20001,
  "message": "user not found",
  "timestamp": 1719504000000,
  "requestId": "req-abc123-def456",
  "path": "/api/v1/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### 1.4 HTTP 状态码

依据 AGENTS.md §9.3：

| 状态码 | 场景             | 说明                         |
| ------ | ---------------- | ---------------------------- |
| 200    | 成功             | 查询、更新成功               |
| 201    | 创建成功         | POST 创建资源                |
| 204    | 删除成功         | DELETE 无返回体              |
| 400    | 参数校验失败     | `class-validator` 校验未通过 |
| 401    | 未认证           | 缺少 Token 或 Token 过期     |
| 403    | 无权限           | Token 有效但权限不足         |
| 404    | 资源不存在       | 请求的资源未找到             |
| 409    | 资源冲突         | 用户名/邮箱已存在等          |
| 422    | 业务规则校验失败 | 业务流程不满足前置条件       |
| 429    | 请求频率限制     | 超过速率限制阈值             |
| 500    | 服务器内部错误   | 未捕获的系统异常             |

### 1.5 错误码

依据 AGENTS.md §12.2：

| 范围        | 分类     | 说明                                       |
| ----------- | -------- | ------------------------------------------ |
| 0           | 成功     |                                            |
| 10000-10999 | 通用错误 | VALIDATION_FAILED, NOT_FOUND 等            |
| 11000-11999 | 认证错误 | UNAUTHORIZED, TOKEN_EXPIRED, TOKEN_INVALID |
| 12000-12999 | 权限错误 | FORBIDDEN                                  |
| 20000-29999 | 业务错误 | 各模块业务异常                             |

### 1.6 认证方式

所有需要认证的接口使用 Bearer Token：

```
Authorization: Bearer <access_token>
```

Token 通过登录接口获取，过期后使用 Refresh Token 刷新。

---

## 2. 认证模块（Auth）

### POST /api/v1/auth/register

注册新用户。

**Request**:

```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "Str0ng!Pass",
  "nickname": "John",
  "captchaKey": "captcha:register:john@example.com",
  "captchaCode": "123456"
}
```

**Response** (201):

```json
{
  "code": 0,
  "message": "register success",
  "data": {
    "_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "username": "john",
    "email": "john@example.com",
    "nickname": "John"
  }
}
```

**错误码**:

| code  | message             | 场景               |
| ----- | ------------------- | ------------------ |
| 20002 | user already exists | 用户名或邮箱已存在 |
| 10001 | validation failed   | 参数校验失败       |
| 11002 | captcha invalid     | 验证码错误或过期   |

---

### POST /api/v1/auth/login

用户登录。

**Request**:

```json
{
  "username": "admin",
  "password": "admin123",
  "captchaKey": "captcha:login:session_abc",
  "captchaCode": "123456"
}
```

**Response** (200):

```json
{
  "code": 0,
  "message": "login success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**错误码**:

| code  | message            | 场景                   |
| ----- | ------------------ | ---------------------- |
| 20003 | password incorrect | 密码错误               |
| 11000 | unauthorized       | 账号已禁用             |
| 11002 | captcha invalid    | 验证码错误             |
| 11003 | account locked     | 登录失败次数过多已锁定 |

---

### POST /api/v1/auth/refresh

刷新 Access Token。

**Request**:

```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response** (200):

```json
{
  "code": 0,
  "message": "token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "bmV3IHJlZnJlcyB0b2tl...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**错误码**:

| code  | message       | 场景                         |
| ----- | ------------- | ---------------------------- |
| 11001 | token expired | Refresh Token 过期           |
| 11002 | token invalid | Refresh Token 无效或已被撤销 |

---

### POST /api/v1/auth/logout

登出（将当前 Token 加入黑名单）。

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200):

```json
{
  "code": 0,
  "message": "logout success"
}
```

---

### GET /api/v1/auth/me

获取当前登录用户信息。

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200):

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "username": "admin",
    "email": "admin@example.com",
    "nickname": "超级管理员",
    "avatar": null,
    "roles": ["super_admin"],
    "permissions": ["*:*"],
    "menus": []
  }
}
```

---

### POST /api/v1/auth/captcha

获取验证码。

**Request**:

```json
{
  "type": "register",
  "key": "user@example.com"
}
```

**Response** (200):

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "captchaKey": "captcha:register:user@example.com",
    "expiresIn": 300
  }
}
```

图片验证码额外返回 base64 图片数据。

---

## 3. 用户模块（User）

### GET /api/v1/users

分页查询用户列表。

**Query 参数**:

| 参数      | 类型     | 必填 | 说明                               |
| --------- | -------- | ---- | ---------------------------------- |
| page      | number   | 否   | 页码，默认 1                       |
| limit     | number   | 否   | 每页条数，默认 20，最大 100        |
| sort      | string   | 否   | 排序字段，默认 createdAt           |
| order     | asc/desc | 否   | 排序方向，默认 desc                |
| keyword   | string   | 否   | 搜索关键字（匹配用户名/邮箱/昵称） |
| status    | string   | 否   | 筛选状态：active/inactive/disabled |
| roleId    | string   | 否   | 筛选角色                           |
| startDate | string   | 否   | 创建时间起始                       |
| endDate   | string   | 否   | 创建时间结束                       |

**Response** (200):

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "username": "admin",
        "email": "admin@example.com",
        "nickname": "超级管理员",
        "avatar": null,
        "status": "active",
        "roles": [{ "_id": "...", "name": "super_admin" }],
        "lastLoginAt": "2024-06-27T10:00:00Z",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

### GET /api/v1/users/:id

查询单个用户详情。

**Response** (200):

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "username": "admin",
    "email": "admin@example.com",
    "nickname": "超级管理员",
    "avatar": null,
    "phone": null,
    "status": "active",
    "roles": [{ "_id": "...", "name": "super_admin", "permissions": ["*:*"] }],
    "directPermissions": [],
    "lastLoginAt": "2024-06-27T10:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**错误码**: 404 USER_NOT_FOUND

---

### POST /api/v1/users

创建用户。

**Request**:

```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "Str0ng!Pass",
  "nickname": "John",
  "phone": "13800138000",
  "roles": ["role_id_1"],
  "status": "active"
}
```

**Response** (201):

```json
{
  "code": 0,
  "message": "user created",
  "data": {
    "_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
  }
}
```

**错误码**: 20002 USER_ALREADY_EXISTS

---

### PATCH /api/v1/users/:id

更新用户信息。

**Request**:

```json
{
  "nickname": "John Updated",
  "phone": "13900139000",
  "status": "active",
  "roles": ["role_id_1", "role_id_2"]
}
```

**Response** (200):

```json
{
  "code": 0,
  "message": "user updated"
}
```

**错误码**: 404 USER_NOT_FOUND

---

### DELETE /api/v1/users/:id

删除用户（软删除）。

**Response** (204): 无返回体

**错误码**: 404 USER_NOT_FOUND

---

### PATCH /api/v1/users/:id/password

修改密码。

**Request**:

```json
{
  "oldPassword": "old_pass",
  "newPassword": "new_str0ng_pass"
}
```

**Response** (200):

```json
{
  "code": 0,
  "message": "password updated"
}
```

**错误码**:

| code  | message            | 场景         |
| ----- | ------------------ | ------------ |
| 20003 | password incorrect | 旧密码错误   |
| 10001 | validation failed  | 密码强度不足 |

---

### PATCH /api/v1/users/:id/status

更新用户状态。

**Request**:

```json
{
  "status": "disabled"
}
```

**Response** (200):

```json
{
  "code": 0,
  "message": "status updated"
}
```

---

## 4. 角色模块（Role）

### GET /api/v1/roles

分页查询角色列表。

**Query 参数**: page, limit, sort, order, keyword, isEnabled

**Response** (200):

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "name": "admin",
        "description": "管理员",
        "permissions": ["user:query", "user:create"],
        "isEnabled": true,
        "isSystem": false,
        "sort": 1,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### GET /api/v1/roles/:id

查询单个角色详情。

**Response** (200):

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "_id": "d4e5f6a7-b8c9-0123-defa-234567890123",
    "name": "admin",
    "description": "管理员",
    "permissions": ["user:query", "user:create", "user:update"],
    "parentId": null,
    "isEnabled": true,
    "isSystem": false,
    "sort": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### POST /api/v1/roles

创建角色。

**Request**:

```json
{
  "name": "editor",
  "description": "内容编辑",
  "permissions": ["content:query", "content:create", "content:update"],
  "parentId": null,
  "sort": 3
}
```

**Response** (201):

```json
{
  "code": 0,
  "message": "role created",
  "data": { "_id": "f6a7b8c9-d012-3456-efab-456789012345" }
}
```

---

### PATCH /api/v1/roles/:id

更新角色信息。

**Request**:

```json
{
  "description": "高级内容编辑",
  "permissions": ["content:query", "content:create", "content:update", "content:delete"],
  "isEnabled": true,
  "sort": 2
}
```

**Response** (200):

```json
{
  "code": 0,
  "message": "role updated"
}
```

---

### DELETE /api/v1/roles/:id

删除角色（软删除）。系统内置角色不可删除。

**Response** (204): 无返回体

**错误码**:

| code  | message                   | 场景             |
| ----- | ------------------------- | ---------------- |
| 20004 | cannot delete system role | 系统内置角色     |
| 20005 | role in use               | 角色已被用户绑定 |

---

## 5. 权限模块（Permission）

### GET /api/v1/permissions

查询权限列表。支持按模块分组查询。

**Query 参数**: module, isEnabled

**Response** (200):

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "code": "user:query",
      "name": "查询用户",
      "module": "user",
      "action": "query",
      "isEnabled": true
    },
    {
      "code": "user:create",
      "name": "创建用户",
      "module": "user",
      "action": "create",
      "isEnabled": true
    }
  ]
}
```

---

### POST /api/v1/permissions/sync

同步权限（将代码中定义的权限注册到数据库）。

**Response** (200):

```json
{
  "code": 0,
  "message": "permissions synced",
  "data": {
    "created": 5,
    "updated": 0,
    "total": 20
  }
}
```

---

## 6. 菜单模块（Menu）

### GET /api/v1/menus/tree

获取菜单树（用于菜单管理页面）。

**Response** (200):

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "_id": "menu_root",
      "name": "系统管理",
      "path": "/system",
      "icon": "Setting",
      "sort": 1,
      "children": [
        {
          "_id": "menu_user",
          "name": "用户管理",
          "path": "/system/user",
          "icon": "User",
          "permission": "user:query",
          "sort": 1,
          "children": []
        }
      ]
    }
  ]
}
```

---

### GET /api/v1/menus/routes

获取当前用户的动态路由（前端根据返回数据动态挂载路由）。

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200):

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "name": "System",
      "path": "/system",
      "component": "layout/index",
      "meta": { "title": "系统管理", "icon": "Setting" },
      "children": [
        {
          "name": "UserList",
          "path": "user",
          "component": "views/user/index",
          "meta": { "title": "用户管理", "icon": "User", "permission": "user:query" }
        }
      ]
    }
  ]
}
```

---

### POST /api/v1/menus

创建菜单。

**Request**:

```json
{
  "name": "日志管理",
  "path": "/system/log",
  "component": "views/system/log/index",
  "icon": "Document",
  "parentId": "menu_system",
  "permission": "system:log",
  "sort": 5,
  "isHidden": false
}
```

**Response** (201):

```json
{
  "code": 0,
  "message": "menu created",
  "data": { "_id": "menu_new" }
}
```

---

### PATCH /api/v1/menus/:id

更新菜单。

### DELETE /api/v1/menus/:id

删除菜单（软删除，含子菜单一并删除）。

---

## 7. 文件模块（Storage）

### POST /api/v1/storage/upload

上传文件。

**Request**: `multipart/form-data`

| 字段      | 类型   | 必填 | 说明       |
| --------- | ------ | ---- | ---------- |
| file      | File   | 是   | 文件内容   |
| directory | string | 否   | 存储子目录 |

**Response** (201):

```json
{
  "code": 0,
  "message": "file uploaded",
  "data": {
    "_id": "file_001",
    "originalName": "photo.jpg",
    "url": "https://cdn.example.com/uploads/2024/abc123.jpg",
    "size": 1024000,
    "mimeType": "image/jpeg"
  }
}
```

---

### GET /api/v1/storage/files

分页查询文件列表。

### DELETE /api/v1/storage/files/:id

删除文件（软删除）。

---

## 8. 通知模块（Notification）

### GET /api/v1/notifications

分页查询当前用户的通知列表。

**Query 参数**: isRead, type

### GET /api/v1/notifications/unread-count

获取未读通知数量。

### PATCH /api/v1/notifications/:id/read

标记通知为已读。

### PATCH /api/v1/notifications/read-all

全部标记已读。

---

## 9. 系统管理模块（System）

### GET /api/v1/system/configs

分页查询系统配置列表。

### GET /api/v1/system/configs/:key

查询单个配置。

### PUT /api/v1/system/configs/:key

更新配置值。

**Request**:

```json
{
  "value": "new_value",
  "description": "配置说明"
}
```

### GET /api/v1/system/monitor

获取系统监控数据。

**Response** (200):

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "cpu": { "usage": 45.2, "cores": 8 },
    "memory": { "total": 16777216, "used": 8388608, "usage": 50.0 },
    "disk": { "total": 512000, "used": 204800, "usage": 40.0 },
    "database": { "status": "connected", "connections": 12 },
    "redis": { "status": "connected", "usedMemory": 256000 },
    "uptime": 3600000
  }
}
```

---

## 10. 日志模块（Log）

### GET /api/v1/logs/operations

分页查询操作日志。

**Query 参数**: page, limit, module, action, userId, startDate, endDate

**Response** (200):

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "_id": "log_001",
        "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "username": "admin",
        "module": "user",
        "action": "create",
        "resourceId": "e5f6a7b8-c9d0-1234-efab-345678901234",
        "resourceType": "User",
        "before": null,
        "after": { "username": "john", "email": "john@example.com" },
        "ip": "192.168.1.100",
        "duration": 150,
        "status": "success",
        "createdAt": "2024-06-27T10:00:00Z"
      }
    ],
    "total": 1000,
    "page": 1,
    "limit": 20,
    "totalPages": 50
  }
}
```

### GET /api/v1/logs/audit

分页查询审计日志（Append Only，不可删除）。

---

## 11. Swagger 规范

依据 AGENTS.md §9.5，所有 API 必须通过 Swagger 文档化：

```typescript
@ApiTags('用户管理')
@Controller('users')
export class UserController {
  @Get()
  @ApiOperation({ summary: '分页查询用户列表', description: '支持关键字搜索、状态筛选、角色筛选' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiResponse({ status: 200, description: '返回分页用户列表', type: PaginatedUserResponseDto })
  async findAll(
    @Query() query: QueryUserDto,
  ): Promise<ApiResponse<PaginatedResult<UserResponseDto>>> {
    // ...
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: '用户创建成功' })
  @ApiResponse({ status: 409, description: '用户名或邮箱已存在' })
  async create(@Body() dto: CreateUserDto): Promise<ApiResponse<{ _id: string }>> {
    // ...
  }
}
```

---

## 12. 权限对照表

| 权限标识           | 关联接口                                 | 说明     |
| ------------------ | ---------------------------------------- | -------- |
| `user:query`       | GET /api/v1/users, GET /api/v1/users/:id | 查询用户 |
| `user:create`      | POST /api/v1/users                       | 创建用户 |
| `user:update`      | PATCH /api/v1/users/:id                  | 更新用户 |
| `user:delete`      | DELETE /api/v1/users/:id                 | 删除用户 |
| `role:query`       | GET /api/v1/roles, GET /api/v1/roles/:id | 查询角色 |
| `role:create`      | POST /api/v1/roles                       | 创建角色 |
| `role:update`      | PATCH /api/v1/roles/:id                  | 更新角色 |
| `role:delete`      | DELETE /api/v1/roles/:id                 | 删除角色 |
| `permission:query` | GET /api/v1/permissions                  | 查询权限 |
| `permission:sync`  | POST /api/v1/permissions/sync            | 同步权限 |
| `menu:query`       | GET /api/v1/menus/*                      | 查询菜单 |
| `menu:create`      | POST /api/v1/menus                       | 创建菜单 |
| `menu:update`      | PATCH /api/v1/menus/:id                  | 更新菜单 |
| `menu:delete`      | DELETE /api/v1/menus/:id                 | 删除菜单 |
| `system:config`    | GET/PUT /api/v1/system/configs/*         | 系统配置 |
| `system:log`       | GET /api/v1/logs/*                       | 查看日志 |
