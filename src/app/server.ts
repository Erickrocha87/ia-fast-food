import Fastify from "fastify";
import { voiceRoutes } from "../modules/voice/routes";

const app = Fastify({ logger: true });

app.register(voiceRoutes);

app.listen({ port: 3000 }, function (err, address) {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }

  app.log.info(`Server Rodando em ${address}`)    
})