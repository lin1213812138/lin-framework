export const UserStatus = {
  /** 已禁用 */
  DISABLED: 0,
  /** 在职 */
  ACTIVE: 1,
  /** 离职 */
  RESIGNED: 2,
  /** 试用期 */
  PROBATION: 3,
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
