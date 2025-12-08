import { FastifyInstance } from "fastify";
import { prisma } from "src/infrastructure/database";

export async function tableRoutes(app: FastifyInstance) {
  app.get("/tables", async (req, reply) => {
    try {
      const tables = await prisma.table.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
      });
      return reply.send(tables);
    } catch (err) {
      console.error("Erro GET /tables", err);
      return reply.status(500).send({ error: "Erro ao buscar mesas" });
    }
  });

  app.post("/tables", async (req, reply) => {
    try {
      const body = req.body as { name?: string };

      const name = (body.name || "").trim();
      if (!name) {
        return reply.status(400).send({ error: "Nome/numero da mesa é obrigatório." });
      }

      const exists = await prisma.table.findUnique({
        where: { name },
      });
      if (exists) {
        return reply.status(409).send({ error: "Já existe uma mesa com esse nome/número." });
      }

      const table = await prisma.table.create({
        data: { name },
      });

      return reply.status(201).send(table);
    } catch (err) {
      console.error("Erro POST /tables", err);
      return reply.status(500).send({ error: "Erro ao criar mesa" });
    }
  });

  app.delete("/tables/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const tableId = Number(id);

      if (Number.isNaN(tableId)) {
        return reply.status(400).send({ error: "ID inválido" });
      }

      // const table = await prisma.table.update({
      //   where: { id: tableId },
      //   data: { active: false },
      // });

      await prisma.table.delete({ where: { id: tableId } });

      return reply.status(204).send();
    } catch (err) {
      console.error("Erro DELETE /tables/:id", err);
      return reply.status(500).send({ error: "Erro ao remover mesa" });
    }
  });
}
