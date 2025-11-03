import { PrismaClient } from "@prisma/client";
import { MenuInputDTO } from "src/modules/menu/domain/dto/menu.dto";
import { IMenuItem } from "src/modules/menu/domain/model/menu.type";
import { IMenuRepository } from "src/modules/menu/domain/repositories/menu.repository";

export class PrismaMenuRepository implements IMenuRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: MenuInputDTO): Promise<IMenuItem> {
    const menu = await this.prisma.menuItem.create({
      data: {
        name: data?.name,
        description: data?.description,
        price: data?.price,
      },
    });
    return menu;
  }

  async findAll(): Promise<IMenuItem[]> {
    const menus = await this.prisma.menuItem.findMany();
    return menus;
  }

  async findByName(name: string): Promise<IMenuItem | null> {
    const menu = await this.prisma.menuItem.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    return menu;
  }

  async deleteById(id: number): Promise<IMenuItem | null> {
    const deletedMenu = await this.prisma.menuItem.delete({
      where: { id: id },
    });
    return deletedMenu;
  }
}
