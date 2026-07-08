export const ErrorCodes = {
  SUCCESS: { code: 0, message: '成功' },
  UNKNOWN_ERROR: { code: 10000, message: '服务器内部错误' },
  VALIDATION_FAILED: { code: 10001, message: '参数校验失败' },
  NOT_FOUND: { code: 10002, message: '资源不存在' },
  CAPTCHA_INVALID: { code: 10003, message: '验证码错误' },

  UNAUTHORIZED: { code: 11000, message: '未登录' },
  TOKEN_EXPIRED: { code: 11001, message: '令牌已过期' },
  TOKEN_INVALID: { code: 11002, message: '令牌无效' },
  ACCOUNT_LOCKED: { code: 11003, message: '账号已被锁定，请稍后再试' },

  FORBIDDEN: { code: 12000, message: '无权限访问' },

  USER_NOT_FOUND: { code: 20001, message: '账号或密码错误' },
  USER_ALREADY_EXISTS: { code: 20002, message: '账号已存在' },
  EMAIL_ALREADY_EXISTS: { code: 20003, message: '邮箱已存在' },
  PASSWORD_INCORRECT: { code: 20004, message: '账号或密码错误' },

  ROLE_CODE_EXISTS: { code: 21001, message: '角色编码已存在' },
  ROLE_HAS_USERS: { code: 21002, message: '该角色下存在用户，无法删除' },
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
