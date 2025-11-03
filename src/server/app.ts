import Fastify, { FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import "dotenv/config";
import OpenAI from "openai";
import { appRoutes } from "./routes/chat/chat.routes";
import { menuRoutes } from "./routes/menu/menu.routes";
import { orderRoutes } from "./routes/order/order.routes";
import { csvRoutes } from "./routes/csv/csv.route";
import fastifyMultipart from "@fastify/multipart";

export class App {
  public server: FastifyInstance;

  constructor() {
    this.server = Fastify({ logger: true });
    this.server.register(fastifyMultipart, {
      limits: { fileSize: 50 * 1024 * 1024 }, 
    });
    this.initMiddleware();
    this.initDecorators();
    this.initRoutes();
  }

  private async initMiddleware() {
    await this.server.register(cors, { origin: true });
    await this.server.register(helmet);
  }

  private initDecorators() {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.server.decorate("openai", openai);
  }

  private async initRoutes() {
    await this.server.register(appRoutes);
    await this.server.register(menuRoutes);
    await this.server.register(orderRoutes);
    await this.server.register(csvRoutes);
  }

  public async start() {
    try {
      await this.server.listen({ port: 1337 });
      console.log("Server rodando em: http://localhost:1337");
    } catch (err) {
      this.server.log.error(err);
      process.exit(1);
    }
  }
}

const app = new App();
app.start();
