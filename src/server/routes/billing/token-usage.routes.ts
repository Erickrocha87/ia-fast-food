import { FastifyInstance } from "fastify";
import { prisma } from "src/infrastructure/database";

export async function tokenUsageRoutes(app: FastifyInstance) {
  app.post(
    "/usage/tokens",
    {
      preHandler: [app.authenticate], 
    },
    async (req, reply) => {

        console.log("bateu aqui");
      const user = req.user as any;

      const { tokens } = req.body as { tokens?: number };

      if (!tokens || tokens <= 0) {
        return reply.status(400).send({ error: "Quantidade de tokens inválida" });
      }

      try {
        const subscription = await prisma.subscription.findFirst({
          where: { userId: user.id, status: "ACTIVE" },
        });

        if (!subscription) {
          return reply.send({ ok: true, ignored: true });
        }

        const newTokensUsed = Math.min(
          subscription.tokensUsed + tokens,
          subscription.tokensLimit
        );

        const updated = await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            tokensUsed: newTokensUsed,
          },
        });

        return reply.send({
          ok: true,
          tokensUsed: updated.tokensUsed,
          tokensLimit: updated.tokensLimit,
        });
      } catch (err: any) {
        console.error("❌ ERRO /usage/tokens:", err);
        return reply
          .status(500)
          .send({ error: "Erro ao registrar uso de tokens" });
      }
    }
  );
}
