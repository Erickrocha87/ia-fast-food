import WebSocket from "ws";

export type RealtimeSocket = WebSocket;

export function createRealtimeOpenAI(): RealtimeSocket {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada");

  const ws = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "realtime=v1",
      },
    }
  );

  ws.on("open", () => {
    console.log("[Realtime] Conectado ao OpenAI");

    ws.send(
      JSON.stringify({
        type: "response.create",
        response: {
          modalities: ["audio", "text"],
          instructions: "Você é um atendente educado, claro e rápido.",
          audio: {
            voice: "alloy",
            format: "opus",
          },
        },
      })
    );
  });

  ws.on("close", () => console.log("[Realtime] Conexão encerrada"));
  ws.on("error", (err) => console.error("[Realtime] Erro:", err));

  return ws;
}
