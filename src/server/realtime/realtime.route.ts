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
          type: "setup",
          tools: mapToolsToRealtime(),
        })
      );
    });

    let hasAudio = false;

    // OPENAI → FRONT
    client.on("message", (raw: any) => {
      const text = raw.toString();

      if (!text.startsWith("{")) {
        socket.send(raw, { binary: true });
        return;
      }

      const event = JSON.parse(text);

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
              response: {
                output: [
                  {
                    type: "function_call_result",
                    name: event.name,
                    content: JSON.stringify(result),
                  },
                ],
              },
            })
          );
        });
      }
    });

    // FRONT → OPENAI
    socket.on("message", async (raw) => {
      console.log("RAW DO CLIENTE:", raw.toString().slice(0, 100));
      let data;
      try {
        data = JSON.parse(raw.toString());
        console.log(data.type);
      } catch {
        return;
      }

      if (data.type === "user_text") {
        client.send(JSON.stringify({ type: "input_text", text: data.text }));
      }

      if (data.type === "user_audio_chunk") {
        console.log("🔵 RECEBI CHUNK DO FRONT, tamanho:", data.audio.length);
        hasAudio = true;
        client.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: {
              data: data.audio, // base64
              format: "opus",
            },
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

        // 🔥 ISSO AQUI FALTAVA
        client.send(
          JSON.stringify({
            type: "response.create",
            response: {
              modalities: ["audio", "text"],
              instructions: "Responda educadamente e rápido.",
              audio: {
                voice: "alloy",
                format: "opus",
              },
            },
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
