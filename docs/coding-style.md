# Coding Style

> **设计依据**: AGENTS.md §3 编码规范、§4 TypeScript 规范、§14 命名规范、§16 AI Coding 规范、§17 代码质量要求
>
> 本文档定义 LIN Framework 的编码规范，所有开发者（含 AI 工具）必须严格遵守。

---

## 1. 通用规则

### 1.1 格式

| 规则     | 值                               |
| -------- | -------------------------------- |
| 缩进     | 2 空格                           |
| 分号     | 必须                             |
| 引号     | 单引号优先，模板字符串使用反引号 |
| 行宽     | 120 字符                         |
| 文件末尾 | 保留一个空行                     |
| 编码     | UTF-8                            |

### 1.2 注释

```typescript
// ✅ 正确：JSDoc 注释
/**
 * 根据用户 ID 查询用户信息并组装权限
 *
 * @param userId - 用户唯一标识
 * @param includePermissions - 是否包含权限树
 * @returns 用户完整信息，含角色和权限
 * @throws NotFoundException 用户不存在时抛出
 */
async findById(userId: string, includePermissions = false): Promise<UserResponse> {
  // ...
}

// ✅ 正确：行内注释说明原因（不是描述做了什么）
// 使用 Redis 而非内存缓存，因为需要在多实例间共享
const cache = this.redisService.get(key);

// ❌ 禁止：描述性注释
// 从 Redis 获取缓存
const cache = this.redisService.get(key);

// ❌ 禁止：注释掉的代码，直接删除
// const oldWay = doSomething();

// ❌ 禁止：TODO 注释（要么现在做，要么建 Issue）
// TODO: fix this later
```

---

## 2. TypeScript 规范

### 2.1 严格模式

`tsconfig.json` 必须启用以下配置：

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 2.2 类型规则

```typescript
// ✅ 正确：使用 unknown 替代 any
function parseData(input: unknown): string {
  if (typeof input === 'string') {
    return input;
  }
  throw new BusinessException(ErrorCodes.VALIDATION_FAILED);
}

// ❌ 禁止：使用 any
function parseData(input: any): string {  // ❌
  return input.toString();
}

// ✅ 正确：优先 interface
interface UserResponse {
  _id: string;
  username: string;
  email: string;
}

// ✅ 正确：联合类型使用 type
type UserStatus = 'active' | 'inactive' | 'disabled';

// ✅ 正确：函数返回值显式标注类型
async findById(id: string): Promise<User | null> {
  return this.repository.findById(id);
}

// ✅ 正确：函数参数显式标注类型
async updateUser(id: string, data: UpdateUserDto): Promise<void> {
  // ...
}

// ✅ 正确：import type 导入仅类型引用
import type { IUserRepository } from './interfaces/i-user-repository.interface';
import { UserService } from './services/user.service';

// ❌ 禁止：类型断言（除非类型守卫或边界转换）
const user = data as User;  // ❌
// ✅ 改用类型守卫或声明式
const user: User = data;
```

### 2.3 枚举

推荐使用 `as const` 对象模式：

```typescript
// ✅ 推荐：as const 对象
export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISABLED: 'disabled',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

// ✅ 也可使用 const enum
export const enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user',
}
```

### 2.4 常量管理

```typescript
// ✅ 正确：全局常量统一管理
// constants/cache-keys.ts
export const CacheKeys = {
  userPermissions: (userId: string) => `lin:user:permissions:${userId}`,
  menuTree: 'lin:menu:tree',
} as const;

// ✅ 正确：业务常量放在模块内
// modules/user/constants/user.constants.ts
export const USER_ERRORS = {
  NOT_FOUND: { code: 20001, message: 'user not found' },
  ALREADY_EXISTS: { code: 20002, message: 'user already exists' },
} as const;

// ❌ 禁止：魔法字符串
if (status === 'active') {  // ❌
// ✅ 正确
import { UserStatus } from './enums/user-status.enum';
if (status === UserStatus.ACTIVE) {
```

---

## 3. 命名规范

### 3.1 变量

| 类型     | 格式                   | 示例                                                    |
| -------- | ---------------------- | ------------------------------------------------------- |
| 变量     | 小驼峰                 | `userName`, `accessToken`                               |
| 常量     | 全大写下划线           | `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE`                  |
| 布尔值   | is/has/should/can 前缀 | `isActive`, `hasPermission`, `shouldRetry`, `canDelete` |
| 私有属性 | `#` 前缀或 `private`   | `#cache`, `private readonly cache`                      |

### 3.2 函数

| 类型          | 格式             | 示例                                               |
| ------------- | ---------------- | -------------------------------------------------- |
| 函数名        | 小驼峰，动词开头 | `getUser`, `createUser`, `updateUser`              |
| Controller    | HTTP 语义        | `findAll`, `findOne`, `create`, `update`, `remove` |
| Service       | 业务意图         | `activateUser`, `resetPassword`, `syncPermissions` |
| Repository    | 数据操作         | `findByCondition`, `updateById`, `softDeleteById`  |
| Composable    | `use` 前缀       | `useAuth`, `usePagination`, `usePermission`        |
| Event Handler | `handle` 前缀    | `handleUserCreated`, `handleOrderPaid`             |

### 3.3 Class

```typescript
// PascalCase + 类型后缀
class UserService {}
class UserController {}
class UserRepository {}
class JwtAuthGuard {}
class BusinessException {}
class LoggingInterceptor {}
class ValidationPipe {}
```

### 3.4 DTO

```
{Action}{Entity}Dto
```

| 示例              | 说明             |
| ----------------- | ---------------- |
| `CreateUserDto`   | 创建用户请求体   |
| `UpdateUserDto`   | 更新用户请求体   |
| `QueryUserDto`    | 用户列表查询参数 |
| `UserResponseDto` | 用户响应体       |
| `LoginDto`        | 登录请求体       |
| `RegisterDto`     | 注册请求体       |

### 3.5 文件名

| 文件类型    | 格式                    | 示例                          |
| ----------- | ----------------------- | ----------------------------- |
| Module      | `{module}.module.ts`    | `user.module.ts`              |
| Controller  | `{name}.controller.ts`  | `user.controller.ts`          |
| Service     | `{name}.service.ts`     | `user.service.ts`             |
| Repository  | `{name}.repository.ts`  | `user.repository.ts`          |
| DTO         | `{name}.dto.ts`         | `create-user.dto.ts`          |
| Schema      | `{name}.schema.ts`      | `user.schema.ts`              |
| Interface   | `{name}.interface.ts`   | `i-user-service.interface.ts` |
| Guard       | `{name}.guard.ts`       | `jwt-auth.guard.ts`           |
| Filter      | `{name}.filter.ts`      | `http-exception.filter.ts`    |
| Pipe        | `{name}.pipe.ts`        | `validation.pipe.ts`          |
| Interceptor | `{name}.interceptor.ts` | `transform.interceptor.ts`    |
| 测试        | `{name}.spec.ts`        | `user.service.spec.ts`        |

### 3.6 目录名

| 规则           | 示例                                                            |
| -------------- | --------------------------------------------------------------- |
| 小写 + 中划线  | `user-profile`, `system-config`                                 |
| 子目录统一复数 | `controllers`, `services`, `repositories`, `dtos`, `interfaces` |

---

## 4. NestJS 编码规范

### 4.1 Module

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => RoleModule),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
```

### 4.2 Controller

```typescript
@ApiTags('用户管理')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '分页查询用户列表' })
  @ApiBearerAuth()
  async findAll(
    @Query() query: QueryUserDto,
  ): Promise<ApiResponse<PaginatedResult<UserResponseDto>>> {
    const result = await this.userService.findAll(query);
    return { code: 0, message: 'success', data: result, timestamp: Date.now(), requestId: '' };
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  async create(@Body() dto: CreateUserDto): Promise<ApiResponse<{ _id: string }>> {
    const _id = await this.userService.create(dto);
    return {
      code: 0,
      message: 'user created',
      data: { _id },
      timestamp: Date.now(),
      requestId: '',
    };
  }
}
```

### 4.3 Service

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleService: RoleService,
  ) {}

  /**
   * 创建用户
   *
   * @param dto - 创建用户参数
   * @returns 新用户 ID
   * @throws BusinessException 用户名或邮箱已存在时抛出
   */
  async create(dto: CreateUserDto): Promise<string> {
    const exists = await this.userRepository.exists({
      $or: [{ username: dto.username }, { email: dto.email }],
    });
    if (exists) {
      throw new BusinessException(ErrorCodes.USER_ALREADY_EXISTS);
    }

    const user = await this.userRepository.create({
      ...dto,
      password: await bcrypt.hash(dto.password, 10),
    });

    return user._id;
  }
}
```

### 4.4 Repository

```typescript
@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async findById(_id: string): Promise<User | null> {
    return this.userModel.findOne({ _id, isDeleted: false }).lean();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email, isDeleted: false }).lean();
  }

  async create(data: Partial<User>): Promise<User> {
    return this.userModel.create(data);
  }

  async updateById(_id: string, data: Partial<User>): Promise<User | null> {
    return this.userModel
      .findOneAndUpdate(
        { _id, isDeleted: false },
        { $set: { ...data, updateDate: Date.now() } },
        { new: true },
      )
      .lean();
  }

  async softDeleteById(_id: string, deletedBy: string): Promise<User | null> {
    return this.userModel
      .findOneAndUpdate(
        { _id, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: Date.now(), deletedBy, updateDate: Date.now() } },
        { new: true },
      )
      .lean();
  }

  async exists(filter: FilterQuery<User>): Promise<boolean> {
    return this.userModel.exists({ ...filter, isDeleted: false }).then(Boolean);
  }
}
```

### 4.5 BaseEntity 公共字段赋值

所有创建操作必须在 Service 层统一赋值公共字段：

```typescript
// shared/utils/base-entity.ts
export function createBaseEntity(creatorId: string, creator: string): Partial<BaseEntity> {
  const now = Date.now();
  return {
    _id: uuidv4(),
    creator,
    creatorId,
    updater: creator,
    updaterId: creatorId,
    createDate: now,
    updateDate: now,
    isDeleted: false,
  };
}

export function updateBaseEntity(updaterId: string, updater: string): Partial<BaseEntity> {
  return {
    updater,
    updaterId,
    updateDate: Date.now(),
  };
}
```

### 4.6 禁止规则

```typescript
// ❌ 禁止跨层调用：Controller 直接调用 Repository
class UserController {
  constructor(private readonly userRepo: UserRepository) {} // ❌
}

// ❌ 禁止 Service 直接操作 Model
class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {} // ❌

  async find(id: string) {
    return this.userModel.findById(id); // ❌ 必须通过 Repository
  }
}

// ❌ 禁止 throw Error
throw new Error('user not found'); // ❌
throw new BusinessException(ErrorCodes.USER_NOT_FOUND); // ✅

// ❌ 禁止 console.log
console.log('debug message'); // ❌
this.logger.log('debug message'); // ✅

// ❌ 禁止 process.env 直接访问
const dbUrl = process.env.DB_URL; // ❌
const dbUrl = this.configService.get('DB_URL'); // ✅

// ❌ 禁止硬编码
const jwtSecret = 'my-secret-key'; // ❌
const jwtSecret = this.configService.get('JWT_SECRET'); // ✅
```

---

## 5. Vue3 编码规范

### 5.1 组件

```vue
<script setup lang="ts">
// ✅ 正确：类型声明方式定义 Props 和 Emits
const props = defineProps<{
  userId: string;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close', reason: 'cancel' | 'success'): void;
  (e: 'saved', _id: string): void;
}>();

// ✅ 正确：Composition API
const loading = ref(false);
const user = ref<UserResponse | null>(null);

async function fetchUser() {
  loading.value = true;
  try {
    user.value = await fetchUserById(props.userId);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <ATable :loading="loading" :data="user" />
  </div>
</template>
```

### 5.2 Pinia Store

```typescript
// ✅ 正确：Setup Store 语法
export const useUserStore = defineStore('user', () => {
  const currentUser = ref<UserResponse | null>(null);
  const permissions = ref<string[]>([]);

  const isLoggedIn = computed(() => currentUser.value !== null);

  async function login(dto: LoginDto) {
    const result = await loginApi(dto);
    currentUser.value = result.user;
    permissions.value = result.permissions;
  }

  return { currentUser, permissions, isLoggedIn, login };
});
```

### 5.3 API 管理

```typescript
// api/user.ts
export function fetchUsers(
  query: QueryUserDto,
): Promise<ApiResponse<PaginatedResult<UserResponseDto>>> {
  return request.get('/api/v1/users', { params: query });
}

export function createUser(dto: CreateUserDto): Promise<ApiResponse<{ _id: string }>> {
  return request.post('/api/v1/users', dto);
}

// api/request.ts - 统一 Axios 实例
export const request = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
});

// 请求拦截器：自动附加 Token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：401 自动刷新 Token
request.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // 尝试刷新 Token
    }
    return Promise.reject(error);
  },
);
```

### 5.4 视图页面组件拆分

`index.vue` **只包含列表/表格逻辑**，其余所有非列表功能（创建、编辑、详情、导入等）必须抽离为独立组件，放在同级的 `components/` 目录下。

**目录结构**

```
views/{module}/
├── index.vue                  # 列表页（表格 + 查询 + 删除）
├── components/
│   ├── {Module}FormModal.vue  # 创建/编辑弹窗
│   ├── {Module}Detail.vue     # 详情页（可选）
│   └── {Module}ImportModal.vue # 导入弹窗（可选）
```

**index.vue 的职责（仅限）**

- 列表查询与分页
- 表格渲染
- 搜索/筛选表单
- 删除确认弹窗
- 管理子组件的 `visible` / `mode` / `selectedData` 状态
- 打开/关闭子组件的函数

**子组件的职责**

- 接收 `visible` / `mode` / `data` 等 props
- 内部维护自身的表单状态与校验规则
- 触发 `close` / `saved` 事件通知父组件

**组件命名规范**

| 文件     | 命名规则                  | 示例                   |
| -------- | ------------------------- | ---------------------- |
| 列表页   | `index.vue`               | `views/user/index.vue` |
| 表单弹窗 | `{Module}FormModal.vue`   | `UserFormModal.vue`    |
| 详情页   | `{Module}Detail.vue`      | `RoleDetail.vue`       |
| 导入弹窗 | `{Module}ImportModal.vue` | `FileImportModal.vue`  |

**示例：User 模块**

```vue
<!-- views/user/index.vue -->
<script setup lang="ts">
// 只引入子组件
import UserFormModal from './components/UserFormModal.vue';

// 列表状态
const data = ref([]);
const loading = ref(false);
const showFormModal = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const selectedUser = ref(null);

function openCreate() {
  formMode.value = 'create';
  selectedUser.value = null;
  showFormModal.value = true;
}

function openEdit(row: UserInfo) {
  formMode.value = 'edit';
  selectedUser.value = row;
  showFormModal.value = true;
}

function onSaved() {
  showFormModal.value = false;
  loadData();
}
</script>

<template>
  <!-- 列表表格 -->
  <n-data-table :data="data" :loading="loading" />

  <!-- 子组件 -->
  <UserFormModal
    :visible="showFormModal"
    :mode="formMode"
    :user-data="selectedUser"
    @close="showFormModal = false"
    @saved="onSaved"
  />
</template>
```

```vue
<!-- views/user/components/UserFormModal.vue -->
<script setup lang="ts">
const props = defineProps<{
  visible: boolean;
  mode: 'create' | 'edit';
  userData: Partial<UserInfo> | null;
}>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

// 表单状态、校验规则、提交逻辑都在此处
</script>

<template>
  <n-modal :show="visible" @update:show="emit('close')">
    <!-- 表单内容 -->
  </n-modal>
</template>
```

**禁止**

- ❌ 在 `index.vue` 内直接写 `<n-modal>` 或 `<n-drawer>` 表单弹窗
- ❌ 在 `index.vue` 内维护表单的详细状态（字段值、校验规则）
- ❌ 跨模块引用子组件（子组件只能被同模块的 `index.vue` 使用）

---

## 6. 代码质量

### 6.1 ESLint

使用 `@typescript-eslint/strict-type-checked` 规则集，配合 `eslint-plugin-import` 和 `eslint-plugin-prettier`。

自定义规则：

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': 'error',
    '@typescript-eslint/no-require-imports': 'error',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling'],
        'newlines-between': 'always',
      },
    ],
  },
};
```

### 6.2 Prettier

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 6.3 单元测试

```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, { provide: IUserRepository, useValue: mockRepository }],
    }).compile();

    service = module.get(UserService);
    repository = module.get(IUserRepository);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      repository.findById.mockResolvedValue(mockUser);
      const result = await service.findById('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      expect(result).toEqual(mockUser);
    });

    it('should throw when user not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findById('b2c3d4e5-f6a7-8901-bcde-f12345678901')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

覆盖率要求：

| 层级       | 最低覆盖率 |
| ---------- | ---------- |
| Service    | 90%        |
| Controller | 80%        |
| Repository | 70%        |

---

## 7. Git 规范

### 7.1 Commit 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**type**:

| 类型       | 用途           |
| ---------- | -------------- |
| `feat`     | 新功能         |
| `fix`      | Bug 修复       |
| `refactor` | 重构           |
| `perf`     | 性能优化       |
| `style`    | 代码风格       |
| `test`     | 测试相关       |
| `docs`     | 文档相关       |
| `chore`    | 构建/工具/依赖 |

**示例**:

```
feat(auth): implement OAuth2 login with Google

- Add Passport Google strategy
- Add social account linking
- Add unit tests for OAuth service

Closes #123
```

### 7.2 分支规范

```
main          # 生产分支
├── develop   # 开发分支
├── feat/*    # 功能分支
├── fix/*     # 修复分支
└── release/* # 发布分支
```

---

## 8. AI Coding 规范

### 8.1 核心原则

1. **遵循 NestJS 最佳实践** — 所有生成代码必须符合 NestJS 官方架构
2. **禁止重复代码** — 发现重复必须提取复用
3. **优先复用** — 修改前先查项目是否已有类似实现
4. **优先扩展** — 通过继承/组合/插件扩展，而非修改
5. **保持模块解耦** — 不引入循环依赖
6. **考虑长期演进** — 避免临时方案

### 8.2 代码与注释同步生成

生成代码时必须同时生成注释，禁止先写代码后补注释。注释不是"可选项"，是代码交付物的必要组成部分。

| 生成内容     | 必须同步生成的注释                          |
| ------------ | ------------------------------------------- |
| 函数         | TSDoc（说明 + @param + @returns + @throws） |
| 类           | 类说明（职责、使用场景）                    |
| DTO          | 每个字段的 @ApiProperty 说明                |
| Vue 组件     | Props / Emits / 组件用途说明                |
| 已有代码修改 | 同步更新对应的注释                          |

### 8.3 生成代码前的流程

```
分析项目现有架构与风格
    ↓
确定代码所属模块与层级
    ↓
检查是否有可复用基类/工具/组件
    ↓
生成代码（遵循所有规范）
    ↓
自我审查：是否满足规范？
```

### 8.3 代码自检清单

生成代码后必须检查：

- [ ] 是否有重复代码？
- [ ] 是否所有新增函数都有 TSDoc 注释？
- [ ] 是否使用了 `any`？
- [ ] 是否有 TODO？
- [ ] 是否有魔法字符串/数字？
- [ ] 是否有硬编码配置？
- [ ] 是否有直接 `throw Error`？
- [ ] 是否有 `console.log`？
- [ ] DTO 是否添加了 Validation？
- [ ] Controller 是否添加了 Swagger？
- [ ] 是否有单元测试？
- [ ] 是否遵守了分层调用规则？
- [ ] 是否引入了循环依赖？
