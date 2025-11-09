import { FastifyRequest, FastifyReply } from "fastify";
import multer from "fastify-multer";
import { CsvImportService } from "../services/csv.service";
import { createWriteStream } from "fs";
import { unlink } from "fs/promises";
import { pipeline } from "stream/promises";
import { tmpdir } from "os";
import { join } from "path";

const upload = multer({ dest: "uploads/" });

export class CsvController {
  csvImportService: CsvImportService;

  constructor(csvImportService: CsvImportService) {
    this.csvImportService = csvImportService;
  }

   async importMenu(req: FastifyRequest, reply: FastifyReply) {
    try {
      const file = await (req as any).file();
      if (!file) throw new Error("Arquivo CSV não enviado.");

      const allowed = ["text/csv", "application/vnd.ms-excel", "application/csv"];
      if (!allowed.includes(file.mimetype)) {
        throw new Error(`Tipo de arquivo não suportado: ${file.mimetype}`);
      }

      const tempPath = join(tmpdir(), `${Date.now()}-${file.filename}`);
      await pipeline(file.file, createWriteStream(tempPath));

      const result = await this.csvImportService.importMenu(tempPath);

      await unlink(tempPath).catch(() => {});

      return reply.status(200).send(result);
    } catch (error) {
      console.error("Erro na importação CSV:", error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  }
}

export const csvUploadMiddleware = upload.single("file");
