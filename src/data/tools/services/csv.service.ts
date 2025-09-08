import * as fs from 'fs';
import * as path from 'path';

// Tipagem opcional para cada linha do CSV
export interface Pedido {
  id: string;
  cliente: string;
  produto: string;
  quantidade: number;
  preco: number;
}

export class CsvService {
  private filePath: string;

  constructor() {
    this.filePath = path.join(__dirname, '../../../data/pedidos.csv');
  }

  // Lê o CSV e retorna como array de objetos
  public readCsv(): Pedido[] {
    const fileContent = fs.readFileSync(this.filePath, 'utf-8');

    // Quebra em linhas
    const lines = fileContent.trim().split('\n');

    // Cabeçalhos
    const headers = lines[0].split(',');

    // Transforma cada linha em objeto
    const rows = lines.slice(1).map((line) => {
      const values = line.split(',');
      const entry: any = {};

      headers.forEach((header, index) => {
        entry[header.trim()] = values[index].trim();
      });

      // Converter campos numéricos, se necessário
      if (entry.quantidade) entry.quantidade = Number(entry.quantidade);
      if (entry.preco) entry.preco = Number(entry.preco);

      return entry as Pedido;
    });

    return rows;
  }
}
