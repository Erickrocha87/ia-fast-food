import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { MenuItem } from "../../common/@types/order-state";


export class CsvService {
  private filePath: string;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    this.filePath = path.join(__dirname, "../../data/mock/pedidos.csv");
  }

  public readCsv(): MenuItem[] {
    const fileContent = fs.readFileSync(this.filePath, "utf-8");
    const lines = fileContent.trim().split("\n");
    const headers = lines[0].split(",");

    const rows = lines.slice(1).map((line) => {
      const values = line.split(",");
      const entry: any = {};
      headers.forEach((header, index) => {
        entry[header.trim()] = values[index]?.trim();
      });

      return {
        name: entry.name,
        price: parseFloat(entry.price),
        description: entry.description,
      } as MenuItem;
    });

    return rows;
  }
}
