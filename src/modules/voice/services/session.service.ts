import { RealtimeAgent, RealtimeSession } from "@openai/agents-realtime";
import { env } from "../../../config/env";
import { agentTools } from "../../tools/services/agent-tools.service";

export class SessionService {
  private agent: RealtimeAgent;
  private session: RealtimeSession;

  constructor() {
    this.agent = new RealtimeAgent({
      name: "Assistant",
      instructions: `Você é um assistente de voz para restaurante.
- Sempre fale e escreva apenas em *português do Brasil*.
- Seja simpático e objetivo.
- Confirme os itens pedidos em português, nunca traduza nomes próprios.
- Use apenas as ferramentas fornecidas para gerenciar o pedido.
- Preços estão no CSV fornecido; não invente itens.
- Quando o cliente perguntar "o que tem", liste alguns itens com preços em reais (R$).
- Ao final, ofereça resumo e total do pedido.`,
      tools: agentTools,
      
    });

    this.session = new RealtimeSession(this.agent, {
      model: "gpt-realtime",
    });
  }

  async createSession() {

    console.log("SESSION COMPLETA:", this.session);

    console.log("AGENT COMPLETO:", this.agent);

    if (!env.openaiKey) {
      throw new Error("OPENAI_API_KEY não definida no .env");
    }

    await this.session.connect({
      apiKey: () => env.openaiKey!,
    });

    return {
      agentName: this.agent.name,
      connected: true,
      
    };
  }
}
