import { FastifyInstance } from "fastify";
import { prisma } from "src/infrastructure/database";

export async function orderCashierRoutes(app: FastifyInstance) {
  // const guards = [app.authenticate, app.authorizeRoles(["ADMIN", "USER"])];

  app.get("/orders/cashier/completed", async (req, reply) => {
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
      console.error("Erro GET /orders/cashier/completed", err);
      return reply
        .status(500)
        .send({ error: "Erro ao buscar pedidos concluídos (caixa)" });
    }
  });

  app.patch("/orders/cashier/:id/paid", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };

      const updated = await prisma.order.update({
        where: { id: Number(id) },
        data: { status: "Ready" },
      });

      return reply.send({ ok: true, order: updated });
    } catch (err) {
      console.error("Erro PATCH /orders/cashier/:id/paid", err);
      return reply.status(500).send({ error: "Erro ao marcar como pago" });
    }
  });

  app.get("/orders/cashier/paid", async (req, reply) => {
    try {
      const orders = await prisma.order.findMany({
        where: { status: "Ready" },
        orderBy: { updatedAt: "desc" },
        include: {
          orderItems: { include: { menuItem: true } },
        },
      });

      return reply.send(orders);
    } catch (err) {
      console.error("Erro GET /orders/cashier/paid", err);
      return reply.status(500).send({ error: "Erro ao buscar pedidos pagos" });
    }
  });
}
