import { FastifyInstance } from "fastify";
import { prisma } from "src/infrastructure/database";

export async function planRoutes(app: FastifyInstance) {
  app.get("/plans", async (req, reply) => {
    try {
      const plans = await prisma.plan.findMany({
        orderBy: { priceMonthly: "asc" },
      });

      return reply.send(
        plans.map((p) => ({
          id: p.slug,
          nome: p.name,
          description: p.description,
          tokensMensais: p.tokensPerMonth,
          tablets: p.maxTablets ?? "Ilimitados",
          precoMensal: p.priceMonthly / 100,
          precoAnual: p.priceYearly / 100,
        }))
      );
    } catch (err: any) {
      console.error("❌ ERRO /plans:", err);
      return reply.status(500).send({ error: "Erro ao listar planos" });
    }
  });
}
