// src/modules/menu/services/menu.service.ts
import { MenuInputDTO } from "../domain/dto/menu.dto";
import { IMenuRepository } from "../domain/repositories/menu.repository";
import { prisma } from "src/infrastructure/database";
import { toolCache } from "src/modules/realtime/session-state.service";

const MENU_CACHE_KEY = "menu:all";

class MenuService {
  menuRepository: IMenuRepository;

  constructor(menuRepository: IMenuRepository) {
    this.menuRepository = menuRepository;
  }

  create = async (data: MenuInputDTO) => {
    const createdMenu = await this.menuRepository.create(data);
    // invalida cache do menu ao criar item
    await this.invalidateMenuCache();
    return createdMenu;
  };

  findAll = async () => {
    const menus = await this.menuRepository.findAll();
    return menus;
  };

  findByName = async (name: string) => {
    const menu = await this.menuRepository.findByName(name);

    if (!menu) {
      throw new Error(`Item "${name}" não encontrado no cardápio.`);
    }

    return menu;
  };

  deleteById = async (id: number) => {
    const deletedMenu = await this.menuRepository.deleteById(id);
    await this.invalidateMenuCache();
    return deletedMenu;
  };

  async invalidateMenuCache() {
    const redisKey = `toolcache:${MENU_CACHE_KEY}`;
    const { redis } = await import("src/infrastructure/redis/redis");
    await redis.del(redisKey);
  }

  async getAllMenuItemsCached() {
    const cached = await toolCache<any[]>(MENU_CACHE_KEY);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    const items = await prisma.menuItem.findMany({
      orderBy: { name: "asc" },
    });

    await toolCache(MENU_CACHE_KEY, items);
    return items;
  }
}

export { MenuService };
