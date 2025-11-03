import { FastifyInstance } from "fastify";
import { orderController } from "src/modules/order/controllers";

const orderRoutes = (app: FastifyInstance) => {
  app.post("/orders/item/add", orderController.addItem);
  app.post("/orders", orderController.createOrAttachToOpen);
  app.get("/orders/:orderId/summary", orderController.getSummary);
  app.put("/orders/:orderId/status", orderController.updateStatus);
  app.delete("/orders/item/remove", orderController.removeItem);
};

export { orderRoutes };
