import { CsvImportService } from "../services/csv.service";
import { CsvController } from "./csv.controller";

const csvService = new CsvImportService();

const csvController = new CsvController(csvService);

export { csvController };