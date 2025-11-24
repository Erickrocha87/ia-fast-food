import { FastifyInstance } from "fastify";
import { prisma } from "src/infrastructure/database";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get("/dashboard/stats", async (req, reply) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Pedidos de hoje
      const pedidosHoje = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: today,
          },
        },
        include: {
          orderItems: true,
        },
      });

      const totalPedidos = pedidosHoje.length;

      // Somar total de cada pedido
      const faturamento = pedidosHoje.reduce((acc, order) => {
        const totalOrder = order.orderItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        return acc + totalOrder;
      }, 0);

      // Pedidos ativos
      const ordensAtivas = await prisma.order.count({
        where: { status: "Open" },
      });

      // Tempo médio (fake simples)
      const tempoMedio = 12;

      return reply.send({
        totalPedidos,
        faturamento,
        ordensAtivas,
        tempoMedio,
      });
    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: "Erro ao carregar estatísticas" });
    }
  });
}
