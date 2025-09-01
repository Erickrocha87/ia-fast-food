import type { FastifyInstance } from "fastify";
import { createSession } from "./controllers/session.controller";

export async function voiceRoutes(app: FastifyInstance) {

  app.get("/session", createSession);

  app.get("/", async (req, reply) => {
    return reply.send({
      message: "Servidor de voz rodando",
      status: "ok",
    });
  });
}
