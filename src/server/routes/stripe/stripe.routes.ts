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
      console.log("🧾 /stripe/checkout body:", { plano, tipo });

      if (!plano || !tipo) {
        return reply
          .status(400)
          .send({ error: "Dados de plano ou tipo de cobrança inválidos." });
      }

      const plan = await prisma.plan.findUnique({
        where: { slug: plano },
      });

      console.log("🔎 Plano encontrado:", plan);

      if (!plan) {
        return reply.status(400).send({ error: "Plano inválido." });
      }

      const isMensal = tipo === "mensal";
      
      const baseAmount = isMensal ? plan.priceMonthly : plan.priceYearly;

      if (baseAmount == null) {
        return reply
          .status(400)
          .send({ error: "Valor do plano não configurado." });
      }

      const unitAmount = Math.round(Number(baseAmount) * 100); 

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
      return reply.status(500).send({ error: "Erro ao criar sessão Stripe." });
    }
  });
}
