import Fastify from "fastify";
import { voiceRoutes } from "../modules/voice/routes";
import { CsvService } from "../tools/services/csv.service";


const app = Fastify({ logger: true });

app.register(voiceRoutes);

// Lê o CSV e mostra no log
const csvService = new CsvService();
const pedidos = csvService.readCsv();

app.log.info("📦 Pedidos carregados do CSV:");
pedidos.forEach((p) => {
  app.log.info(`➡️ ${p.name} | R$${p.price} | ${p.description}`);
});

app.listen({ port: 3000 }, function (err, address) {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }

  app.log.info(`✅ Server Rodando em ${address}`);
});
