import { FastifyInstance } from "fastify";
import { csvController } from "src/modules/csv/controllers"


const csvRoutes = (app: FastifyInstance) => {
    app.post("/csv/import", (req, reply) => csvController.importMenu(req, reply));
}

export { csvRoutes }