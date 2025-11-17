import { FastifyInstance } from "fastify";
import { prisma } from "src/infrastructure/database";

export async function orderKitchenRoutes(app: FastifyInstance) {
  
  // 👉 Buscar pedidos Abertos (pendentes na cozinha)
  app.get("/orders/kitchen", async (req, reply) => {
    try {
      const orders = await prisma.order.findMany({
        where: { status: "Open" },
        orderBy: { createdAt: "desc" },
        include: {
          orderItems: {
            include: {
              menuItem: true
            }
          }
        }
      });

      return reply.send(orders);
    } catch (err) {
      console.error("Erro GET /orders/kitchen", err);
      reply.status(500).send({ error: "Erro ao buscar pedidos" });
    }
  });

  // 👉 ALTERAR STATUS do pedido para "Paid" (Concluído)
  app.patch("/orders/kitchen/:id/complete", async (req, reply) => {
    try {
      const id = Number(req.params.id);

      const updated = await prisma.order.update({
        where: { id },
        data: { status: "Paid" }
      });

      return reply.send({ ok: true, order: updated });
    } catch (err) {
      console.error("Erro PATCH /orders/kitchen/:id/complete", err);
      reply.status(500).send({ error: "Erro ao concluir pedido" });
    }
  });

  // 👉 Buscar pedidos Concluídos (Paid)
  app.get("/orders/kitchen/completed", async (req, reply) => {
    try {
      const orders = await prisma.order.findMany({
        where: { status: "Paid" },
        orderBy: { createdAt: "desc" },
        include: {
          orderItems: { include: { menuItem: true } }
        }
      });

      return reply.send(orders);
    } catch (err) {
      console.error("Erro GET /orders/kitchen/completed", err);
      reply.status(500).send({ error: "Erro ao buscar concluídos" });
    }
  });

}
