import { FastifyInstance } from "fastify";

// Esta é a única rota de backend que você precisa
export async function sessionRoutes(app: FastifyInstance) {
  app.get("/session", async (request, reply) => {
    try {
      console.log("[SERVER] Recebida requisição /session");
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY não configurada no .env");
      }

      const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview",
          voice: "alloy",
          modalities: ["text", "audio"],
        }),
      });

      if (!r.ok) {
        const text = await r.text();
        console.error("[SERVER] Erro ao criar sessão Realtime:", text);
        return reply.status(500).send({ error: text });
      }

      const data = await r.json();
      console.log("[SERVER] Sessão criada com sucesso.");
      return reply.send(data);
    } catch (e: any) {
      console.error("[SERVER] Erro inesperado em /session:", e);
      return reply.status(500).send({ error: e.message });
    }
  });
}