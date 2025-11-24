// src/modules/realtime/summary.service.ts
import OpenAI from "openai";
import {
  getLastTranscript,
  getTableSummary,
  setTableSummary,
} from "./session-state.service";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Atualiza o summary da mesa com base na última fala da IA.
 * Usa modelo barato só pra comprimir contexto.
 */
export async function updateSummaryFromTranscript(
  tableNumber: string
): Promise<string | null> {
  const latest = await getLastTranscript(tableNumber);
  if (!latest) {
    return await getTableSummary(tableNumber);
  }

  const previous = (await getTableSummary(tableNumber)) || "";

  const prompt = `
Você é um compressor de memória para um atendente virtual de restaurante.

Resumo atual da mesa (pode estar vazio):
"${previous || "(vazio)"}"

Nova fala importante do atendente virtual:
"${latest}"

Reescreva um NOVO resumo curto (máximo 4 linhas),
somente com fatos relevantes sobre:
- o que o cliente já pediu,
- itens removidos,
- dúvidas/pedidos pendentes.

Não repita detalhes irrelevantes. Texto direto, em português.
`;

  const result = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 120,
  });

  const newSummary = (result.choices[0].message.content || "").trim();

  if (newSummary) {
    await setTableSummary(tableNumber, newSummary);
  }

  return newSummary || previous || null;
}
