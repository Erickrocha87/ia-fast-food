import { prisma } from "src/infrastructure/database";
import { MenuService } from "src/modules/menu/services/menu.service";
import { PrismaMenuRepository } from "src/modules/menu/infrastructure/prisma/repositories/prisma-menu-repository";
import { readCsv } from "../infrastructure/csv.reader";

export class CsvImportService {
  async importMenu(filePath: string) {
    const rows = await readCsv(filePath);
    const validItems = rows.filter((r) => r.name && r.price);

    if (validItems.length === 0) {
      throw new Error("Nenhum item válido encontrado no CSV.");
    }

    const chunkSize = 500;
    for (let i = 0; i < validItems.length; i += chunkSize) {
      const batch = validItems.slice(i, i + chunkSize);
      await prisma.menuItem.createMany({
        data: batch.map((item) => ({
          name: item.name.trim(),
          description: item.description ?? "",
          price: parseFloat(item.price),
        })),
        skipDuplicates: true,
      });
    }

    return {
      success: true,
      imported: validItems.length,
    };
  }
}
