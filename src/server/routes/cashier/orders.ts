// src/server/routes/cashier/orders.ts
import { FastifyInstance } from "fastify";
import { prisma } from "src/infrastructure/database";

export async function orderCashierRoutes(app: FastifyInstance) {
  // se quiser proteger:
  // const guards = [app.authenticate, app.authorizeRoles(["ADMIN", "USER"])];

  // 1) Pedidos CONCLUÍDOS (status Paid) -> aba "Concluídos"
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

  // 2) Marcar pedido como PAGO -> Paid -> Ready
  app.patch("/orders/cashier/:id/paid", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };

      const updated = await prisma.order.update({
        where: { id: Number(id) },
        data: { status: "Ready" }, // aqui é o PAGO
      });

      return reply.send({ ok: true, order: updated });
    } catch (err) {
      console.error("Erro PATCH /orders/cashier/:id/paid", err);
      return reply.status(500).send({ error: "Erro ao marcar como pago" });
    }
  });

  // 3) Pedidos PAGOS (status Ready) -> aba "Pagos"
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
