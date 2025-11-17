import { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";

import { createRealtimeOpenAI } from "./openai-realtime";
import { handleFunctionCall, mapToolsToRealtime } from "./tool-adapter";
import { SessionMemory } from "./session-memory";

export async function realtimeRoutes(app: FastifyInstance) {
  app.get("/realtime/:tableNumber", { websocket: true }, (ws, req) => {
    const socket = ws;
    const table = (req.params as any).tableNumber;
    const session = new SessionMemory(table);

    const client = createRealtimeOpenAI();

    client.on("open", () => {
      console.log(`Realtime conectado – mesa ${table}`);

      client.send(
        JSON.stringify({
          type: "response.create",
          modalities: ["audio", "text"],
          instructions: "Você é um atendente educado, claro e rápido.",
          audio: {
            voice: "alloy",
            // Este formato de SAÍDA (mp3) está correto
            format: "mp3",
          },
          tools: mapToolsToRealtime(),
        })
      );
    });

    // OPENAI → FRONT
    client.on("message", (raw: any) => {
      if (Buffer.isBuffer(raw)) {
        console.log("Recebi áudio binário da OpenAI");
        socket.send(raw, { binary: true });
        return;
      }

      const text = raw.toString();
      console.log("📩 EVENTO DO OPENAI (TEXTO):", text);

      let event;
      try {
        event = JSON.parse(text);
      } catch (e) {
        console.warn("Não foi possível parsear evento da OpenAI:", text);
        return;
      }

      if (event.type === "response.output_text.delta") {
        socket.send(
          JSON.stringify({ type: "assistant_text", text: event.delta })
        );
      }

      if (event.type === "response.function_call_arguments.done") {
        handleFunctionCall(event).then((result) => {
          client.send(
            JSON.stringify({
              type: "response.create",
              output: [
                {
                  type: "function_call_result",
                  name: event.name,
                  content: JSON.stringify(result),
                },
              ],
            })
          );
        });
      }
    });

    // FRONT → OPENAI
    socket.on("message", async (raw) => {
      let data;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (data.type === "user_text") {
        client.send(JSON.stringify({ type: "input_text", text: data.text }));
      }

      // Os dados de 'audio' agora são Base64 de PCM16 puro
      if (data.type === "user_audio_chunk") {
        client.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: data.audio,
          })
        );
      }

      if (data.type === "user_audio_end") {
        console.log("🟢 Commitando áudio para OpenAI...");

        client.send(
          JSON.stringify({
            type: "input_audio_buffer.commit",
          })
        );
      }
    });

    socket.on("close", () => {
      console.log(`Mesa ${table} desconectou`);
      client.close();
    });
  });
}