import { FastifyInstance } from "fastify";
import { menuController } from "src/modules/menu/controllers";

const menuRoutes = (app: FastifyInstance) => {
    app.post("/menu", menuController.create);

    app.get("/menu", menuController.findAll);
};

export { menuRoutes };