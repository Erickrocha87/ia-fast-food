import { FastifyInstance } from "fastify";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function stripeRoutes(app: FastifyInstance) {
  app.post("/stripe/checkout", async (req, reply) => {
    const { plano, total, tipo } = req.body as any;

    try {
      const SUCCESS_URL = `http://localhost:3000/sucesso?plano=${encodeURIComponent(plano)}&tipo=${encodeURIComponent(tipo)}`;
      const CANCEL_URL = `http://localhost:3000/falha?plano=${encodeURIComponent(plano)}&tipo=${encodeURIComponent(tipo)}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        locale: "pt-BR",
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: plano,
                description: `Assinatura do plano ${plano}`,
              },
              unit_amount: Math.round(total * 100),
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

  app.post("/stripe/pix", async (req, reply) => {
    const { plano, total } = req.body as any;

    try {
      const pi = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: "brl",
        payment_method_types: ["pix"],
        description: `Plano ${plano}`,
      });

      return reply.send({
        clientSecret: pi.client_secret,
        pix: pi.next_action?.pix_display_qr_code,
      });
    } catch (err: any) {
      console.log("❌ ERRO PIX:", err);
      return reply.status(500).send({ error: err.message });
    }
  });
}
