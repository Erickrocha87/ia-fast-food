import 'fastify';
import OpenAI from 'openai';

// Este código "aumenta" a definição de tipos do Fastify e informa ao TypeScript que a nossa instância terá uma propriedade 'openai'
declare module 'fastify' {
  export interface FastifyInstance {
    openai: OpenAI;
  }
}