/*
 * @Author: 林翔 2276928094@qq.com
 * @Date: 2026-07-05 16:12:48
 * @LastEditors: 林翔 2276928094@qq.com
 * @LastEditTime: 2026-07-05 16:21:03
 * @FilePath: \lin-framework\apps\admin-web\src\constants\user.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * 用户状态枚举
 * 0-已禁用 / 1-在职 / 2-离职 / 3-试用期
 * @see apps/server/src/modules/auth/enums/auth.enum.ts
 */
export const UserStatus = {
  DISABLED: 0,
  ACTIVE: 1,
  RESIGNED: 2,
  PROBATION: 3,
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/** 状态 → 标签颜色映射 */
export const statusColors: Record<number, string> = {
  [UserStatus.DISABLED]: 'error',
  [UserStatus.ACTIVE]: 'success',
  [UserStatus.RESIGNED]: 'warning',
  [UserStatus.PROBATION]: 'info',
};

/** 状态 → 显示文本映射 */
export const statusLabels: Record<number, string> = {
  [UserStatus.DISABLED]: '禁用',
  [UserStatus.ACTIVE]: '在职',
  [UserStatus.RESIGNED]: '离职',
  [UserStatus.PROBATION]: '试用期',
};

/** 状态下拉选项（用于表单选择） */
export const statusOptions = [
  { label: statusLabels[UserStatus.ACTIVE], value: UserStatus.ACTIVE },
  { label: statusLabels[UserStatus.DISABLED], value: UserStatus.DISABLED },
  { label: statusLabels[UserStatus.RESIGNED], value: UserStatus.RESIGNED },
  { label: statusLabels[UserStatus.PROBATION], value: UserStatus.PROBATION },
];

/** 状态下拉选项（用于搜索栏，value 为字符串，清空即全部） */
export const statusSearchOptions = statusOptions.map((opt) => ({
  label: opt.label,
  value: opt.value,
}));
