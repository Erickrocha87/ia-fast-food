import { FastifyInstance } from "fastify";
import { restaurantTools, toolDefinitions } from "src/modules/tools/services";


export async function realtimeWebRTCRoutes(app: FastifyInstance) {
  app.get("/session", async (req, reply) => {
    try {
      const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview",
          voice: "alloy",
          modalities: ["audio", "text"],
          tool_choice: "auto",
          tools: toolDefinitions,
        }),
      });

      if (!r.ok) return reply.status(500).send(await r.text());
      return reply.send(await r.json());

    } catch (e: any) {
      return reply.status(500).send(e.message);
    }
  });

  app.post("/tool-call", async (req, reply) => {
    const { name, args } = req.body as any;

    if (!restaurantTools[name]) {
      return reply.send({ ok: false, error: "Tool não encontrada" });
    }

    try {
      const result = await restaurantTools[name](args);
      return reply.send({ ok: true, result });
    } catch (err: any) {
      return reply.send({
        ok: false,
        error: err.message || "Erro interno",
      });
    }
  });
}
