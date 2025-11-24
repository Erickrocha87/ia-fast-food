// src/modules/realtime/routes/realtime-webrtc.routes.ts
import { FastifyInstance } from "fastify";
import {
  updateTableState,
  setLastTranscript,
  getTableSummary,
} from "src/modules/realtime/session-state.service";
import { updateSummaryFromTranscript } from "src/modules/realtime/summary.service";
import { restaurantTools, toolDefinitions } from "src/modules/tools/services";

export async function realtimeWebRTCRoutes(app: FastifyInstance) {
  // 1) Criação de sessão realtime (client_secret)
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
          tools: toolDefinitions,
          tool_choice: "auto",
        }),
      });

      if (!r.ok) {
        const text = await r.text();
        return reply.status(500).send(text);
      }

      const json = await r.json();
      return reply.send(json);
    } catch (e: any) {
      return reply.status(500).send(e.message);
    }
  });

  // 2) Execução das tools
  app.post("/tool-call", async (req, reply) => {
    const { name, args } = req.body as any;
    const tableNumber: string | undefined = args?.tableNumber;

    console.log("[/tool-call] name:", name, "args:", args);

    const impl = restaurantTools[name];
    if (!impl) {
      return reply.send({ ok: false, error: `Tool '${name}' não encontrada` });
    }

    try {
      const result = await impl(args);

      if (tableNumber) {
        const orderIdFromTool =
          (result && (result.orderId as number | undefined)) ?? null;

        await updateTableState(tableNumber, {
          currentOrderId: orderIdFromTool,
        });

        // se quiser manter summary:
        await updateSummaryFromTranscript(tableNumber);
      }

      return reply.send({ ok: true, result });
    } catch (err: any) {
      console.error("[/tool-call] erro:", err);
      return reply.send({
        ok: false,
        error: err.message || "Erro interno ao executar tool",
      });
    }
  });

  // 3) Receber transcrição para summary (opcional, mas deixei)
  app.post("/transcript", async (req, reply) => {
    const { tableNumber, text } = req.body as any;

    if (!tableNumber || !text) {
      return reply.status(400).send({ ok: false, error: "Dados inválidos" });
    }

    try {
      await setLastTranscript(tableNumber, text);
      await updateSummaryFromTranscript(tableNumber);
      return reply.send({ ok: true });
    } catch (err: any) {
      console.error("[/transcript] erro:", err);
      return reply.status(500).send({
        ok: false,
        error: err.message || "Erro ao salvar transcrição",
      });
    }
  });

  // 4) Expor summary atual da mesa
  app.get("/summary/:tableNumber", async (req, reply) => {
    const { tableNumber } = req.params as any;

    if (!tableNumber) {
      return reply.status(400).send("tableNumber é obrigatório");
    }

    const summary = (await getTableSummary(String(tableNumber))) || "";
    return reply.type("text/plain").send(summary);
  });
}
