import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from 'fastify-plugin';

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate("authenticate", async function(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: "Token inválido ou ausente" });
    }
  });

  fastify.decorate("authorizeRoles", function(allowedRoles: string[]) {
    return async function(request: FastifyRequest, reply: FastifyReply) {

      const user = request.user;
      
      if (!user || !user.role || !allowedRoles.includes(user.role)) {
        const rolesText = allowedRoles.join(" ou ");
        return reply.code(403).send({ error: `Acesso negado: Requer as roles ${rolesText}.` });
      }
    };
  });
}

export default fp(authPlugin);