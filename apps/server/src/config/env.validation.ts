import * as Joi from 'joi';

/**
 * 环境变量校验 Schema
 *
 * 使用 Joi 对所有环境变量进行类型、必填、默认值校验。
 * ConfigModule 启动时自动执行校验，校验失败应用立即退出。
 *
 * @see ConfigModule.forRoot({ validationSchema })
 */
export const envValidationSchema = Joi.object({
  /** 运行环境 */
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development'),

  /** 应用监听端口，必填 */
  PORT: Joi.number()
    .required()
    .messages({ 'any.required': 'PORT is required' }),

  /** MongoDB 连接 URI，必填 */
  MONGODB_URI: Joi.string()
    .uri()
    .required()
    .messages({ 'any.required': 'MONGODB_URI is required' }),

  /** Redis 主机地址 */
  REDIS_HOST: Joi.string().default('localhost'),
  /** Redis 端口 */
  REDIS_PORT: Joi.number().default(6379),
  /** Redis 密码 */
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  /** Redis 数据库索引 */
  REDIS_DB: Joi.number().default(0),

  /** JWT 签名密钥，至少 32 位，必填 */
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({ 'any.required': 'JWT_SECRET is required (min 32 chars)' }),

  /** Access Token 过期时间 */
  JWT_ACCESS_TOKEN_EXPIRES: Joi.string().default('15m'),
  /** Refresh Token 过期时间 */
  JWT_REFRESH_TOKEN_EXPIRES: Joi.string().default('7d'),

  /** 文件存储驱动：local | s3 | oss */
  STORAGE_DRIVER: Joi.string().valid('local', 's3', 'oss').default('local'),
  /** 本地存储路径 */
  STORAGE_PATH: Joi.string().default('./uploads'),

  /** 日志级别 */
  LOG_LEVEL: Joi.string()
    .valid('debug', 'info', 'warn', 'error')
    .default('debug'),

  /** 验证码过期时间（秒） */
  CAPTCHA_EXPIRES: Joi.number().default(300),
  /** Rate Limit 时间窗口（秒） */
  RATE_LIMIT_TTL: Joi.number().default(60),
  /** Rate Limit 窗口内最大请求数 */
  RATE_LIMIT_MAX: Joi.number().default(100),
});
