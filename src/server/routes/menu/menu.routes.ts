import { FastifyInstance } from "fastify";
import { menuController } from "src/modules/menu/controllers";

const menuRoutes = (app: FastifyInstance) => {
  app.post(
    "/menu",
    { onRequest: [app.authenticate, app.authorizeRoles(["ADMIN", "USER"])] },
    menuController.create
  );

  app.get(
    "/menu",
    { onRequest: [app.authenticate, app.authorizeRoles(["ADMIN", "USER"])] },
    menuController.findAll
  );
};

export { menuRoutes };
