import { FastifyInstance } from "fastify";
import Stripe from "stripe";
import { prisma } from "src/infrastructure/database";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function stripeRoutes(app: FastifyInstance) {
  app.post("/stripe/checkout", async (req, reply) => {
    const { plano, tipo } = req.body as {
      plano: string;
      tipo: "mensal" | "anual";
    };

    try {
      const plan = await prisma.plan.findUnique({
        where: { slug: plano },
      });

      if (!plan) {
        return reply.status(400).send({ error: "Plano inválido." });
      }

      const isMensal = tipo === "mensal";

      const unitAmount = isMensal ? plan.priceMonthly : plan.priceYearly;

      const SUCCESS_URL = `http://localhost:3000/sucesso?plano=${encodeURIComponent(
        plano
      )}&tipo=${encodeURIComponent(tipo)}`;
      const CANCEL_URL = `http://localhost:3000/falha?plano=${encodeURIComponent(
        plano
      )}&tipo=${encodeURIComponent(tipo)}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        locale: "pt-BR",
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: `ServeAI – Plano ${plan.name} ${
                  isMensal ? "(Mensal)" : "(Anual)"
                }`,

                description: [
                  "Perfeito para restaurantes com atendimento inteligente por IA.",
                  "",
                  `• ${plan.tokensPerMonth.toLocaleString(
                    "pt-BR"
                  )} tokens por mês`,
                  `• ${
                    plan.maxTablets === null
                      ? "Tablets ilimitados"
                      : `${plan.maxTablets} tablets incluídos`
                  }`,
                  `• ${
                    isMensal ? "Cobrança mensal" : "Cobrança anual"
                  } com renovação automática`,
                ].join("\n"),

                metadata: {
                  plan_id: String(plan.id),
                  plan_slug: plan.slug,
                  tokens_per_month: String(plan.tokensPerMonth),
                  max_tablets: plan.maxTablets?.toString() ?? "unlimited",
                  billing_period: isMensal ? "monthly" : "yearly",
                },
              },

              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        success_url: SUCCESS_URL,
        cancel_url: CANCEL_URL,
      });

      return reply.send({ url: session.url });
    } catch (err: any) {
      console.log("❌ ERRO CHECKOUT:", err);
      return reply.status(500).send({ error: err.message });
    }
  });
}
