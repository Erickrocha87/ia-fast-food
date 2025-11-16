import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import axios from "axios";

interface PixRequestBody {
  valor: number;            // Ex: 45.00
  descricao: string;        // Ex: "Pagamento Serve-Ai – Pedido #1234"
  emailCliente: string;     // Ex: "cliente@example.com"
  nomeCliente: string;      // Ex: "Cliente"
  sobrenomeCliente: string; // Ex: "Teste"
}

export async function pixRoutes(app: FastifyInstance) {
  app.post(
    "/pix",
    async (request: FastifyRequest<{ Body: PixRequestBody }>, reply: FastifyReply) => {
      const { valor, descricao, emailCliente, nomeCliente, sobrenomeCliente } = request.body;

      try {
        const accessToken = process.env.MP_ACCESS_TOKEN!;
        if (!accessToken) {
          throw new Error("Token do Mercado Pago não configurado em MP_ACCESS_TOKEN");
        }

        const response = await axios.post(
          "https://api.mercadopago.com/v1/payments",
          {
            transaction_amount: valor,
            description: descricao,
            payment_method_id: "pix",
            payer: {
              email: emailCliente,
              first_name: nomeCliente,
              last_name: sobrenomeCliente,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "X-Idempotency-Key": `pix_${Date.now()}_${Math.random()}`,
            },
          }
        );

        const data = response.data;
        const qrCode = data.point_of_interaction.transaction_data.qr_code;
        const qrCodeBase64 = data.point_of_interaction.transaction_data.qr_code_base64;
        const ticketUrl = data.point_of_interaction.transaction_data.ticket_url;

        return reply.send({
          status: data.status,
          qrCode,
          qrCodeBase64,
          ticketUrl,
          paymentId: data.id,
        });
      } catch (err: any) {
        request.log.error(err);
        return reply.status(500).send({
          error: "Erro ao gerar pagamento PIX",
          details: err.response?.data || err.message,
        });
      }
    }
  );
}
