import { AsyncLocalStorage } from 'node:async_hooks';

export interface UserContextValue {
  id: string;
  username: string;
}

/**
 * 异步请求上下文，用于在 Hook/Service 中获取当前请求的用户信息。
 *
 * 由 UserContextInterceptor 在请求入口处初始化。
 */
export const userContext = new AsyncLocalStorage<UserContextValue | undefined>();