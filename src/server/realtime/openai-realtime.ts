import WebSocket from "ws";

export type RealtimeSocket = WebSocket;

export function createRealtimeOpenAI(): RealtimeSocket {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada");

  // [MUDANÇA CRÍTICA]
  // input_audio_format=pcm16 -> Estamos enviando PCM16
  // input_audio_sample_rate=24000 -> Na taxa de 24kHz
  // output_audio_format=mp3 -> Queremos MP3 de volta (como antes)
  const ws = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview&input_audio_format=pcm16&input_audio_sample_rate=24000&output_audio_format=mp3",
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "realtime=v1",
      },
    }
  );

  ws.on("close", () => console.log("[Realtime] Conexão encerrada"));
  ws.on("error", (err) => console.error("[Realtime] Erro:", err));

  return ws;
}