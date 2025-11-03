import fs from "fs";
import Papa from "papaparse";
import * as fastcsv from "fast-csv";

export async function readCsv(filePath: string): Promise<any[]> {
  const stats = fs.statSync(filePath);
  const fileSizeMB = stats.size / (1024 * 1024);

  if (fileSizeMB < 10) {
    const file = fs.readFileSync(filePath, "utf8");

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (err) => reject(err),
      });
    });
  }
  
  console.log(`Arquivo grande detectado (${fileSizeMB.toFixed(2)} MB) — usando streaming`);

  return new Promise((resolve, reject) => {
    const rows: any[] = [];
    fs.createReadStream(filePath)
      .pipe(fastcsv.parse({ headers: true, ignoreEmpty: true, trim: true }))
      .on("error", reject)
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows));
  });
}
