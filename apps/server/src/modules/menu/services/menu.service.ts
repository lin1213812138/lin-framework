import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { MenuRepository } from '@/modules/menu/repositories/menu.repository';
import type { MenuTreeNode } from '@/modules/menu/interfaces/menu.interface';
import type { Menu } from '@/modules/menu/schemas/menu.schema';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(private readonly menuRepository: MenuRepository) {}

  /** 构建菜单树 */
  async getTree(): Promise<MenuTreeNode[]> {
    const all = await this.menuRepository.findAll();
    return this.buildTree(all);
  }

  async findById(id: string): Promise<Menu | null> {
    return this.menuRepository.findById(id);
  }

  async create(data: Partial<Menu>): Promise<Menu> {
    return this.menuRepository.create(data);
  }

  async update(id: string, data: Partial<Menu>): Promise<Menu | null> {
    const menu = await this.menuRepository.findById(id);
    if (!menu) {
      throw new NotFoundException({ code: 10002, message: '菜单不存在' });
    }
    return this.menuRepository.update(id, data);
  }

  /** 删除菜单（级联删除子菜单） */
  async remove(id: string): Promise<boolean> {
    const menu = await this.menuRepository.findById(id);
    if (!menu) {
      throw new NotFoundException({ code: 10002, message: '菜单不存在' });
    }

    // 递归删除所有子菜单
    await this.cascadeRemove(id);

    return true;
  }

  /**
   * 获取当前用户的菜单树（按权限过滤）
   *
   * 当 permissionCodes 为空数组时（RBAC 权限体系尚未完整加载），
   * 返回全部可用菜单；否则仅返回用户有权限访问的菜单。
   *
   * @param permissionCodes - 用户拥有的权限标识数组
   * @returns 过滤后的菜单树
   */
  async getUserMenus(permissionCodes: string[]): Promise<MenuTreeNode[]> {
    const all = await this.menuRepository.findAll();

    // RBAC 未就绪时返回全部菜单
    if (permissionCodes.length === 0) {
      return this.buildTree(all.filter((m) => m.type !== 'button'));
    }

    // 筛选用户有权访问的菜单
    const visible = all.filter((menu) => {
      // 目录类型：始终显示（有子菜单即可）
      if (menu.type === 'dir') return true;
      // 按钮类型：不显示在侧栏
      if (menu.type === 'button') return false;
      // 菜单类型：没有权限限制或用户有权限
      if (!menu.permission) return true;
      return permissionCodes.includes(menu.permission);
    });

    const tree = this.buildTree(visible);

    // 递归移除没有子菜单的目录
    return this.pruneEmptyDirs(tree);
  }

  // ─── Private ──────────────────────────────────────────────

  private buildTree(menus: Menu[]): MenuTreeNode[] {
    const map = new Map<string, MenuTreeNode>();
    const roots: MenuTreeNode[] = [];

    for (const menu of menus) {
      map.set(menu._id, { ...menu, children: [] });
    }

    for (const menu of menus) {
      const id = menu._id;
      const node = map.get(id)!;
      if (menu.parentId && map.has(menu.parentId)) {
        map.get(menu.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    // 递归排序
    const sortNodes = (nodes: MenuTreeNode[]) => {
      nodes.sort((a, b) => a.sort - b.sort);
      nodes.forEach((n) => sortNodes(n.children));
    };
    sortNodes(roots);

    return roots;
  }

  private async cascadeRemove(id: string): Promise<void> {
    const children = await this.menuRepository.findByParentId(id);
    for (const child of children) {
      const childId = child._id;
      await this.cascadeRemove(childId);
    }
    await this.menuRepository.remove(id);
  }

  private pruneEmptyDirs(nodes: MenuTreeNode[]): MenuTreeNode[] {
    return nodes
      .filter((node) => {
        if (node.type === 'dir') {
          node.children = this.pruneEmptyDirs(node.children);
          return node.children.length > 0;
        }
        return true;
      })
      .sort((a, b) => a.sort - b.sort);
  }
}
