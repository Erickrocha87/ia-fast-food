import { prisma } from "src/infrastructure/database";
import { readCsv } from "../infrastructure/csv.reader";

type NormalizedItem = {
  name: string;
  description: string;
  price: number;
};

function normalizeItem(row: any): NormalizedItem | null {
  // Tenta achar o nome em vários campos possíveis
  const nameField =
    row.name ??
    row.nome ??
    row.produto ??
    row.nome_produto ??
    row["nome_do_produto"];

  // Tenta achar o preço em vários campos possíveis
  const priceField =
    row.price ??
    row.preco ??
    row["preço"] ??
    row.valor ??
    row.valor_unitario ??
    row["valor_unitário"];

  const descriptionField =
    row.description ??
    row.descricao ??
    row["descrição"] ??
    row.observacao ??
    row.observações ??
    "";

  if (!nameField || !priceField) {
    return null;
  }

  const name = String(nameField).trim();

  // Normaliza preço: remove R$, pontos de milhar, troca vírgula por ponto
  const priceStr = String(priceField)
    .replace("R$", "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const price = parseFloat(priceStr);

  if (!name || isNaN(price)) {
    return null;
  }

  return {
    name,
    description: String(descriptionField).trim(),
    price,
  };
}

export class CsvImportService {
  async importMenu(filePath: string) {
    const rows = await readCsv(filePath);

    console.log("Total de linhas lidas do CSV:", rows.length);

    const normalizedItems = rows
      .map(normalizeItem)
      .filter((i): i is NormalizedItem => i !== null);

    console.log("Itens válidos após normalização:", normalizedItems.length);

    if (normalizedItems.length === 0) {
      throw new Error("Nenhum item válido encontrado no CSV. Verifique os cabeçalhos (name/preço).");
    }

    const chunkSize = 500;

    for (let i = 0; i < normalizedItems.length; i += chunkSize) {
      const batch = normalizedItems.slice(i, i + chunkSize);

      await prisma.menuItem.createMany({
        data: batch.map((item) => ({
          name: item.name,
          description: item.description,
          price: item.price,
        })),
        skipDuplicates: true,
      });
    }

    return {
      success: true,
      imported: normalizedItems.length,
    };
  }
}
