import fs from "fs";
import Papa from "papaparse";
import * as fastcsv from "fast-csv";

export async function readCsv(filePath: string): Promise<any[]> {
  const stats = fs.statSync(filePath);
  const fileSizeMB = stats.size / (1024 * 1024);

  const normalizeHeader = (header: string) =>
    header
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

  if (fileSizeMB < 10) {
    const file = fs.readFileSync(filePath, "utf8");

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: normalizeHeader,
        complete: (results) => {
          console.log("🔎 Primeiras linhas (Papa):", results.data.slice(0, 3));
          if (results.data[0]) {
            console.log("🔑 Keys da primeira linha:", Object.keys(results.data[0]));
          }
          resolve(results.data);
        },
        error: (err) => reject(err),
      });
    });
  }

  console.log(`Arquivo grande detectado (${fileSizeMB.toFixed(2)} MB) — usando streaming`);

  return new Promise((resolve, reject) => {
    const rows: any[] = [];

    fs.createReadStream(filePath)
      .pipe(
        fastcsv.parse({
          headers: (headers) =>
            headers.map((h: string) =>
              h
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "_")
            ),
          ignoreEmpty: true,
          trim: true,
        
        })
      )
      .on("error", reject)
      .on("data", (row) => rows.push(row))
      .on("end", () => {
        console.log("🔎 Primeiras linhas (fast-csv):", rows.slice(0, 3));
        if (rows[0]) {
          console.log("🔑 Keys da primeira linha:", Object.keys(rows[0]));
        }
        resolve(rows);
      });
  });
}
