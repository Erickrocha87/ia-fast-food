import type { FastifyReply, FastifyRequest } from "fastify";
import { SessionService } from "../services/session.service";

const service = new SessionService();

export async function createSession(req: FastifyRequest, reply: FastifyReply) {
  try {
    console.log("Requisição recebida em /session");

    const data = await service.createSession();

    console.log("Sessão criada com sucesso:", data);
    return reply.send(data);
  } catch (e: any) {
    console.error("Erro inesperado:", e.message);
    return reply.status(500).send({ error: e.message });
  }
}
