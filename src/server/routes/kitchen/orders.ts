import { FastifyInstance } from "fastify";
import { prisma } from "src/infrastructure/database";

export async function orderKitchenRoutes(app: FastifyInstance) {
  app.get("/orders/kitchen", async (req, reply) => {
    try {
      const orders = await prisma.order.findMany({
        where: { status: "Open" },
        orderBy: { createdAt: "asc" },
        include: {
          orderItems: {
            include: { menuItem: true },
          },
        },
      });

      return reply.send(orders);
    } catch (err) {
      console.error("Erro GET /orders/kitchen", err);
      return reply.status(500).send({ error: "Erro ao buscar pedidos" });
    }
  });

  app.patch("/orders/kitchen/:id/complete", async (req, reply) => {
    try {
      const id = Number((req.params as any).id);

      const updated = await prisma.order.update({
        where: { id },
        data: { status: "Paid" },
      });

      return reply.send({ ok: true, order: updated });
    } catch (err) {
      console.error("Erro PATCH /orders/kitchen/:id/complete", err);
      return reply.status(500).send({ error: "Erro ao concluir pedido" });
    }
  });

  app.get("/orders/kitchen/completed", async (req, reply) => {
    try {
      const orders = await prisma.order.findMany({
        where: { status: "Paid" },
        orderBy: { updatedAt: "desc" },
        include: {
          orderItems: { include: { menuItem: true } },
        },
      });

      return reply.send(orders);
    } catch (err) {
      console.error("Erro GET /orders/kitchen/completed", err);
      return reply.status(500).send({ error: "Erro ao buscar concluídos" });
    }
  });
}
