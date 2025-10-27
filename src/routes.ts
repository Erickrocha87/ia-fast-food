import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  toolDefinitions,
  toolImplementations,
} from "./modules/tools/services/agent-tools.service";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Schema do corpo da requisição
const chatRequestBodySchema = z.object({
  message: z.string(),
});
export type ChatRequestBody = z.infer<typeof chatRequestBodySchema>;

export async function appRoutes(app: FastifyInstance) {
  app.post(
    "/chat",
    {
      schema: {
        body: zodToJsonSchema(chatRequestBodySchema),
      },
    },
    async (req: FastifyRequest<{ Body: ChatRequestBody }>, reply) => {
      console.log("--- Rota /chat acionada ---");
      const { message } = req.body;

      try {
        const messages: ChatCompletionMessageParam[] = [
          {
            role: "system",
            content:
              "Você é um atendente virtual de fast food. Atenda o cliente de forma simpática, clara e objetiva, tirando dúvidas sobre o cardápio, orientando sobre promoções, acompanhamentos, formas de pagamento e ajudando a montar o pedido. Sempre incentive o cliente a finalizar a compra e ofereça sugestões de acordo com o que ele pedir. Fale de maneira clara e sem em português do BRASIL",
          },
          { role: "user", content: message },
        ];

        const tools = toolDefinitions.map((tool) => ({
          type: "function" as const,
          function: {
            name: tool.name,
            description: tool.description,
            parameters: zodToJsonSchema(tool.parameters),
          },
        }));

        const response = await app.openai.chat.completions.create({
          model: "gpt-4o",
          messages: messages,
          tools: tools,
          tool_choice: "auto",
        });

        const responseMessage = response.choices[0].message;
        const toolCalls = responseMessage.tool_calls;

        if (toolCalls) {
          messages.push(responseMessage);

          for (const toolCall of toolCalls) {
            if (toolCall.type === "function") {
              const functionName = toolCall.function.name;
              const implementation = toolImplementations.get(functionName);
              if (implementation) {
                try {
                  console.log(`  -> Executando: ${functionName}`);
                  const functionArgs = JSON.parse(toolCall.function.arguments);
                  const functionResponse = await implementation(functionArgs);
                  messages.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    content: JSON.stringify(functionResponse),
                  });
                } catch (error) {
                  console.error(
                    `Erro na ferramenta ${functionName}:`,
                    error
                  );
                  messages.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    content: `Erro ao executar a ferramenta: ${
                      (error as Error).message
                    }`,
                  });
                }
              }
            }
          }

          console.log("Enviando resultados das ferramentas de volta");
          const secondResponse = await app.openai.chat.completions.create({
            model: "gpt-4o",
            messages: messages,
          });

          const finalMessage = secondResponse.choices[0].message.content;
          console.log("Resposta final recebida.");
          return reply
            .status(200)
            .send({ responseMessage: finalMessage || "..." });
        }

        const finalMessage = response.choices[0].message.content;
        console.log("Resposta direta recebida.");
        return reply
          .status(200)
          .send({ responseMessage: finalMessage || "..." });
      } catch (error) {
        console.error("ERROOOOOO EM /chat:", error);
        return reply.status(500).send({ error: (error as Error).message });
      }
    }
  );

  app.post(
    "/api/tts",
    {
      schema: {
        body: zodToJsonSchema(z.object({ text: z.string() })),
      },
    },
    async (req: FastifyRequest<{ Body: { text: string } }>, reply) => {
      try {
        const { text } = req.body;

        const mp3 = await app.openai.audio.speech.create({
          model: "tts-1",
          voice: "fable",
          input: text,
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
