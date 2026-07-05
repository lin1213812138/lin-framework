/** Redis Key 前缀：Refresh Token */
export const REFRESH_TOKEN_PREFIX = 'lin:auth:refresh:';

/** Redis Key 前缀：Token 黑名单 */
export const BLACKLIST_PREFIX = 'lin:auth:blacklist:';

/** Redis Key 前缀：验证码 */
export const CAPTCHA_PREFIX = 'lin:captcha:';

/** Redis Key 前缀：登录失败锁 */
export const LOCK_PREFIX = 'lin:auth:lock:';

/** 登录失败最大次数 */
export const MAX_LOGIN_ATTEMPTS = 5;

/** 锁定时间（毫秒） */
export const LOCK_DURATION_MS = 15 * 60 * 1000;
