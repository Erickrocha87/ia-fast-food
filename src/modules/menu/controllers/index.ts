import { prisma } from "src/infrastructure/database";
import { PrismaMenuRepository } from "../infrastructure/prisma/repositories/prisma-menu-repository";
import { MenuService } from "../services/menu.service";
import { MenuController } from "./menu.controller";


const menuRepository = new PrismaMenuRepository(prisma);

const menuService = new MenuService(menuRepository);

const menuController = new MenuController(menuService);

export { menuController };