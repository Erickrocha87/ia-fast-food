import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  buildQuickMenuSummary,
  toolDefinitions,
  toolImplementations,
} from "../../../modules/tools/services/agent-tools.service";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { prisma } from "src/infrastructure/database";

const chatRequestBodySchema = z.object({
  message: z.string(),
  tableNumber: z.string().default("0"), // ⚠️ agora recebemos a mesa
});
export type ChatRequestBody = z.infer<typeof chatRequestBodySchema>;

async function getOrCreateSession(tableNumber: string) {
  let session = await prisma.chatSession.findFirst({ where: { tableNumber } });
  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        tableNumber,
        messages: [],
      },
    });
  }
  return session;
}

async function saveSessionMessages(
  sessionId: number,
  messages: ChatCompletionMessageParam[],
  currentOrderId?: number | null
) {
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      messages: JSON.parse(JSON.stringify(messages)),
      ...(currentOrderId !== undefined ? { currentOrderId } : {}),
    },
  });
}

function buildToolArray() {
  return toolDefinitions.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: zodToJsonSchema(tool.parameters),
    },
  }));
}

function autoArgsWithSession(
  functionName: string,
  rawArgs: any,
  session: { tableNumber: string; currentOrderId: number | null }
) {
  const args = { ...rawArgs };

  if (
    "tableNumber" in
      (toolDefinitions.find((t) => t.name === functionName)?.parameters.shape ??
        {}) &&
    !args.tableNumber
  ) {
    args.tableNumber = session.tableNumber;
  }

  if (
    "orderId" in
      (toolDefinitions.find((t) => t.name === functionName)?.parameters.shape ??
        {}) &&
    !args.orderId &&
    session.currentOrderId
  ) {
    args.orderId = session.currentOrderId;
  }

  return args;
}

// atualiza currentOrderId quando o tool retornar um novo
function maybeUpdateOrderIdFromToolResponse(
  functionName: string,
  functionResponse: any,
  session: { currentOrderId: number | null }
) {
  if (functionName === "add_to_order" && functionResponse?.orderId) {
    session.currentOrderId = functionResponse.orderId;
  }
}

export async function appRoutes(app: FastifyInstance) {
  app.post(
    "/chat",
    { schema: { body: zodToJsonSchema(chatRequestBodySchema) } },
    async (req: FastifyRequest<{ Body: ChatRequestBody }>, reply) => {
      console.log("--- Rota /chat acionada ---");
      const { message, tableNumber } = req.body;

      try {
        const session = await getOrCreateSession(tableNumber);

        const quickMenu = await buildQuickMenuSummary(10);
        const systemPrompt: ChatCompletionMessageParam = {
          role: "system",
          content: `Você é um atendente virtual de fast food (pt-BR) e sua resposta será convertida para áudio (TTS).
Contexto:
- Uma sessão por mesa (tableNumber: ${tableNumber}).
- Use SEMPRE as ferramentas para listar cardápio, adicionar ao pedido, ver resumo.
- NÃO invente itens que não existem. Se tiver dúvida, chame a ferramenta.
- Mantenha o pedido da mesa até o fechamento (não perca o contexto).
- Não fale a descrição dos itens, apenas liste-os.

REGRAS DE FALA (ESSENCIAL PARA O ÁUDIO):
1.  **PONTUAÇÃO IMPECÁVEL**: Use vírgulas (,) e pontos (.) de forma rigorosa. A cada vírgula, o áudio fará uma pequena pausa. A cada ponto, fará uma pausa maior. Isso é crucial para a clareza.
2.  **CLAREZA ABSOLUTA**: Escreva os nomes dos itens e os preços de forma completa e correta. Ex: "Hambúrguer Clássico", "R$ 25,50". Nunca use gírias ou abreviações (Ex: não fale "ramburguer").
3.  **FRASES COMPLETAS**: Sempre termine suas frases. Nunca corte uma ideia ou um preço pela metade.
4.  **SEJA CONCISO**: Responda de forma direta, sem enrolar.

Cardápio (resumo):
${quickMenu}
`,
        };

        // puxa o histórico
        let history: ChatCompletionMessageParam[] = [];

        if (session.messages && Array.isArray(session.messages)) {
          history = session.messages as unknown as ChatCompletionMessageParam[];
        } else if (session.messages) {
          try {
            history = JSON.parse(
              JSON.stringify(session.messages)
            ) as ChatCompletionMessageParam[];
          } catch {
            history = [];
          }
        }
        const messages: ChatCompletionMessageParam[] = [
          systemPrompt,
          ...history,
          { role: "user", content: message },
        ];

        const tools = buildToolArray();

        let response = await app.openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          tools,
          tool_choice: "auto",
        });

        let responseMessage = response.choices[0].message;
        let toolCalls = responseMessage.tool_calls;
        ("");
        let loopCount = 0;
        while (toolCalls && loopCount < 4) {
          loopCount++;
          messages.push(responseMessage);

          for (const toolCall of toolCalls) {
            if (toolCall.type !== "function") continue;

            const functionName = toolCall.function.name;
            const implementation = toolImplementations.get(functionName);
            if (!implementation) continue;

            try {
              console.log(`  -> Executando tool: ${functionName}`);
              const args = JSON.parse(toolCall.function.arguments || "{}");

              // injeta tableNumber/orderId se a tool aceitar
              const safeArgs = autoArgsWithSession(functionName, args, {
                tableNumber,
                currentOrderId: session.currentOrderId ?? null,
              });

              const functionResponse = await implementation(safeArgs);

              // atualiza currentOrderId
              maybeUpdateOrderIdFromToolResponse(
                functionName,
                functionResponse,
                session
              );

              messages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                content: JSON.stringify(functionResponse),
              });
            } catch (err) {
              console.error(`Erro na ferramenta ${functionName}:`, err);
              messages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                content: `Erro ao executar a ferramenta: ${
                  (err as Error).message
                }`,
              });
            }
          }

          console.log("Enviando resultados das ferramentas de volta");
          response = await app.openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            tools,
          });

          responseMessage = response.choices[0].message;
          toolCalls = responseMessage.tool_calls;
        }

        messages.push(responseMessage);
        const finalMessage = responseMessage.content ?? "...";

        await saveSessionMessages(
          session.id,
          messages,
          session.currentOrderId ?? null
        );

        console.log("Resposta final recebida.");
        return reply.status(200).send({ responseMessage: finalMessage });
      } catch (error) {
        console.error("ERRO EM /chat:", error);
        return reply.status(500).send({ error: (error as Error).message });
      }
    }
  );

  app.post(
    "/api/tts",
    { schema: { body: zodToJsonSchema(z.object({ text: z.string() })) } },
    async (req: FastifyRequest<{ Body: { text: string } }>, reply) => {
      try {
        const { text } = req.body;

        const mp3 = await app.openai.audio.speech.create({
          model: "tts-1-hd",
          voice: "alloy",
          input: text,
          speed: 0.9,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        reply.header("Content-Type", "audio/mpeg");
        return reply.send(buffer);
      } catch (error) {
        console.error("Erro na rota TTS:", error);
        return reply.status(500).send({ error: "Falha ao gerar áudio." });
      }
    }
  );
}
