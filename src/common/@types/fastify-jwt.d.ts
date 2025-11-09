import "@fastify/jwt";
import { JWT } from "@fastify/jwt"; 

declare module "fastify" {
  interface FastifyReply {
    jwt: {
      sign(
        payload: Record<string, unknown>,
        options?: Partial<JWT["options"]>
      ): string;
    };
  }
}