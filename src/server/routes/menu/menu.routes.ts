import { FastifyInstance } from "fastify";
import { prisma } from "src/infrastructure/database";

const menuRoutes = (app: FastifyInstance) => {
  app.post(
    "/menu",
    { onRequest: [app.authenticate, app.authorizeRoles(["ADMIN", "USER"])] },
    async (req, reply) => {
      try {
        const body = req.body as any;

        const created = await prisma.menuItem.create({
          data: {
            name: body.name,
            description: body.description ?? "",
            price: Number(body.price),
          },
        });

        return reply.status(201).send(created);
      } catch (error) {
        console.error("Erro ao criar menu item:", error);
        return reply.status(500).send({ message: "Erro ao criar menu item" });
      }
    }
  );

  app.get("/menu", async (req, reply) => {
    try {
      const items = await prisma.menuItem.findMany({
        orderBy: { id: "asc" },
      });

      return reply.send(items);
    } catch (error) {
      console.error("Erro ao listar menu items:", error);
      return reply
        .status(500)
        .send({ message: "Erro ao listar itens do cardápio" });
    }
  });

  app.delete(
    "/menu/:id",
    { onRequest: [app.authenticate, app.authorizeRoles(["ADMIN", "USER"])] },
    async (req, reply) => {
      try {
        const { id } = req.params as { id: string };

        const numericId = Number(id);
        if (Number.isNaN(numericId)) {
          return reply.status(400).send({ message: "ID inválido" });
        }

        try {
          const deleted = await prisma.menuItem.delete({
            where: { id: numericId },
          });

          return reply.status(200).send(deleted);
        } catch (err: any) {
          if (err.code === "P2025") {
            return reply.status(404).send({ message: "Item não encontrado" });
          }

          console.error("Erro ao deletar menu item:", err);
          return reply
            .status(500)
            .send({ message: "Erro ao deletar item do cardápio" });
        }
      } catch (error) {
        console.error("Erro ao processar DELETE /menu/:id:", error);
        return reply
          .status(500)
          .send({ message: "Erro ao deletar item do cardápio" });
      }
    }
  );
};

export { menuRoutes };
