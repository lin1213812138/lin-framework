export const MenuType = {
  DIR: 'dir',
  MENU: 'menu',
  BUTTON: 'button',
} as const;

export type MenuType = (typeof MenuType)[keyof typeof MenuType];
