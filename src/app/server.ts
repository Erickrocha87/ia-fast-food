import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";
import OpenAI from "openai";
import { appRoutes } from "../routes";

const app = Fastify({ logger: true });

app.register(cors, {
  origin: true,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.decorate("openai", openai);

app.register(appRoutes);

app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
 
});
