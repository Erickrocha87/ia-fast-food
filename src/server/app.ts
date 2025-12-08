import Fastify, { FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import "dotenv/config";
import OpenAI from "openai";
import { menuRoutes } from "./routes/menu/menu.routes";
import { orderRoutes } from "./routes/order/order.routes";
import { csvRoutes } from "./routes/csv/csv.route";
import fastifyMultipart from "@fastify/multipart";
import fastifyJwt from "fastify-jwt";
import { authRoutes } from "./routes/auth/auth.routes";
import authPlugin from "../common/utils/authorize-role";
import websocketPlugin from "@fastify/websocket";
import { realtimeWebRTCRoutes } from "./routes/realtime/realtime-webrtc.routes";
import { stripeRoutes } from "./routes/stripe/stripe.routes";
import { orderKitchenRoutes } from "./routes/kitchen/orders";
import { orderCashierRoutes } from "./routes/cashier/orders";
import { tableRoutes } from "./routes/tables/tables.routes";
import { dashboardRoutes } from "./routes/dashboard/dashboard.route";
import { planRoutes } from "./routes/billing/plan.routes";
import { subscriptionRoutes } from "./routes/billing/subscription.routes";
import { userRoutes } from "./routes/user/user.routes";
import { tokenUsageRoutes } from "./routes/billing/token-usage.routes";

export class App {
  public server: FastifyInstance;

  constructor() {
    this.server = Fastify({ logger: true });
    this.server.register(fastifyMultipart, {
      limits: { fileSize: 50 * 1024 * 1024 },
    });

    this.server.register(websocketPlugin, {
      options: {
        maxPayload: 10485760
      }
    });

    this.initDecorators();
  }

  private async initMiddleware() {
    await this.server.register(cors, {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    });

    await this.server.register(helmet);
    await this.server.register(authPlugin);
  }

  private initDecorators() {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.server.decorate("openai", openai);
  }

  private registerJWT() {
    const secret = process.env.JWT_SECRET!;
    this.server.register(fastifyJwt, {
      secret: secret,
    });
  }

  private async initRoutes() {
    await this.server.register(menuRoutes);
    await this.server.register(orderRoutes);
    await this.server.register(csvRoutes);
    await this.server.register(authRoutes);
    await this.server.register(realtimeWebRTCRoutes);
    await this.server.register(orderKitchenRoutes);
    await this.server.register(orderCashierRoutes);
    await this.server.register(tableRoutes);
    await this.server.register(dashboardRoutes);
    await this.server.register(planRoutes);
    await this.server.register(stripeRoutes);
    await this.server.register(subscriptionRoutes);
    await this.server.register(userRoutes);
    await this.server.register(tokenUsageRoutes);
  }

  public async start() {
    try {
      await this.registerJWT();
      await this.initMiddleware();
      await this.initRoutes();
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
