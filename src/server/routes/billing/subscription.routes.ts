// src/modules/billing/routes/subscription.routes.ts
import { FastifyInstance } from "fastify";
import { prisma } from "src/infrastructure/database";
import { BillingPeriod, SubscriptionStatus } from "@prisma/client";

export async function subscriptionRoutes(app: FastifyInstance) {
  app.post("/subscription/activate", async (req, reply) => {
    // Depois você troca isso pra pegar do JWT: req.user.id
    const { userId, planSlug, tipo } = req.body as {
      userId: number;
      planSlug: string;
      tipo: "mensal" | "anual";
    };

    if (!userId || !planSlug || !tipo) {
      return reply.status(400).send({ error: "Dados inválidos" });
    }

    const isMensal = tipo === "mensal";
    const billingPeriod: BillingPeriod = isMensal ? "MENSAL" : "ANUAL";

    try {
      const plan = await prisma.plan.findUnique({
        where: { slug: planSlug },
      });

      if (!plan) {
        return reply.status(400).send({ error: "Plano não encontrado" });
      }

      const now = new Date();
      const cycleStart = now;
      const cycleEnd = new Date(now);

      if (isMensal) {
        cycleEnd.setMonth(cycleEnd.getMonth() + 1);
      } else {
        cycleEnd.setFullYear(cycleEnd.getFullYear() + 1);
      }

      // Opcional: desativar outras assinaturas do usuário
      await prisma.subscription.updateMany({
        where: { userId, status: "ACTIVE" },
        data: { status: "CANCELED" },
      });

      const subscription = await prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          billingPeriod,
          status: SubscriptionStatus.ACTIVE,
          tokensLimit: plan.tokensPerMonth, // limite por ciclo (aqui 1 mês; depois se quiser, multiplica pra anual)
          tokensUsed: 0,
          cycleStart,
          cycleEnd,
        },
        include: {
          plan: true,
        },
      });

      return reply.send({ ok: true, subscription });
    } catch (err: any) {
      console.error("❌ ERRO /subscription/activate:", err);
      return reply.status(500).send({ error: "Erro ao ativar assinatura" });
    }
  });

  app.get("/me/subscription", async (req, reply) => {
    const user = req.user; // do JWT

    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      include: { plan: true },
    });

    if (!subscription) {
      return reply.send({ active: false });
    }

    return reply.send({
      active: true,
      plan: subscription.plan.name,
      tokensLimit: subscription.tokensLimit,
      tokensUsed: subscription.tokensUsed,
      tokensRemaining: subscription.tokensLimit - subscription.tokensUsed,
      cycleStart: subscription.cycleStart,
      cycleEnd: subscription.cycleEnd,
    });
  });
}
