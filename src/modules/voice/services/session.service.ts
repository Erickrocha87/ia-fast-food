import { RealtimeAgent, RealtimeSession } from "@openai/agents-realtime";
import { env } from "../../../config/env";
import { agentTools } from "../../tools/services/agent-tools.service";

export class SessionService {
  private agent: RealtimeAgent;
  private session: RealtimeSession;

  constructor() {
    this.agent = new RealtimeAgent({
      name: "Assistant",
      instructions: "Você é um assistente de voz amigável.",
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
