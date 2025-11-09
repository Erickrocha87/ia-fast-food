import 'fastify';
import OpenAI from 'openai';

declare module 'fastify' {
  export interface FastifyInstance {
    openai: OpenAI;
  }
}

interface JwtUserPayload {
  id: number;
  email: string;
  role: 'ADMIN' | 'USER';
}

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtUserPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    authorizeRoles(allowedRoles: Array<JwtUserPayload['role']>): (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void | FastifyReply>;
  }
}declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    authorizeRoles(allowedRoles: Array<JwtUserPayload['role']>): (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void | FastifyReply>;
  }
}