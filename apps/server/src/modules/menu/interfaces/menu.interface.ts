import type { Menu } from '@/modules/menu/schemas/menu.schema';

/** 菜单树节点（含 children） */
export interface MenuTreeNode extends Omit<Menu, 'parentId'> {
  children: MenuTreeNode[];
}

export interface IMenuService {
  getTree(): Promise<MenuTreeNode[]>;

  findById(id: string): Promise<Menu | null>;

  create(data: Partial<Menu>): Promise<Menu>;

  update(id: string, data: Partial<Menu>): Promise<Menu | null>;

  remove(id: string): Promise<boolean>;

  getUserMenus(permissionCodes: string[]): Promise<MenuTreeNode[]>;
}
