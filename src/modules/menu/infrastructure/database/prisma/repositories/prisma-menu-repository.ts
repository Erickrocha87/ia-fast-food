import { PrismaClient } from "@prisma/client";
import { MenuDTO } from "src/modules/menu/domain/dto/menu.dto";
import { IMenu } from "src/modules/menu/domain/model/menu.type";
import { MenuRepository } from "src/modules/menu/domain/repositories/menu.repository";

export class PrismaMenuRepository implements MenuRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: MenuDTO): Promise<IMenu> {
    const menu = await this.prisma.menu.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
      },
    });
    return menu;
  }
}
