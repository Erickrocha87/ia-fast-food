import { FastifyInstance } from "fastify";
import { orderController } from "src/modules/order/controllers";

const orderRoutes = (app: FastifyInstance) => {
  app.post(
    "/orders/item/add",
    { onRequest: [app.authenticate, app.authorizeRoles(["ADMIN", "USER"])] },
    orderController.addItem
  );
  app.post(
    "/orders",
    { onRequest: [app.authenticate, app.authorizeRoles(["ADMIN", "USER"])] },
    orderController.createOrAttachToOpen
  );
  app.get(
    "/orders/:orderId/summary",
    { onRequest: [app.authenticate, app.authorizeRoles(["ADMIN", "USER"])] },
    orderController.getSummary
  );
  app.put(
    "/orders/:orderId/status",
    { onRequest: [app.authenticate, app.authorizeRoles(["ADMIN", "USER"])] },
    orderController.updateStatus
  );
  app.delete(
    "/orders/item/remove",
    { onRequest: [app.authenticate, app.authorizeRoles(["ADMIN", "USER"])] },
    orderController.removeItem
  );
};

export { orderRoutes };
