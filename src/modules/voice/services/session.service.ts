import { RealtimeAgent, RealtimeSession } from "@openai/agents-realtime";
import { env } from "../../../app/config/env";

export class SessionService {
  private agent: RealtimeAgent;
  private session: RealtimeSession;

  constructor() {
    this.agent = new RealtimeAgent({
      name: "Assistant",
      instructions: "Você é um assistente de voz amigável.",
      voice: "alloy",
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
