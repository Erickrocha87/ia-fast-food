import { FastifyReply, FastifyRequest } from "fastify";
import { MenuService } from "../services/menu.service";
import { createMenuBodySchema } from "../schema/menu.schema";

class MenuController {
  menuService: MenuService;

  constructor(menuService: MenuService) {
    this.menuService = menuService;
  }

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = createMenuBodySchema.parse(req.body);

      const createdMenu = await this.menuService.create(payload);
      return reply.status(201).send(createdMenu);
    } catch (error) {
      return reply.status(500).send({
        message: "Erro ao criar menu",
      });
    }
  };

  findAll = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const menus = await this.menuService.findAll();
      return reply.status(200).send(menus);
    } catch (error) {
      return reply.status(500).send({
        message: "Erro ao buscar menus",
      });
    }
  };

  deleteById = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: number };

      const deletedMenuItem = await this.menuService.deleteById(id);

      if (!deletedMenuItem) {
        return reply.status(404).send({
          message: "Menu não encontrado",
        });
      }

      return reply.status(200).send(deletedMenuItem);
    } catch (error) {
      return reply.status(500).send({
        message: "Erro ao deletar menu",
      });
    }
  };
}

export { MenuController };
