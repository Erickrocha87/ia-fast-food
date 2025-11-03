import { prisma } from "src/infrastructure/database";
import { PrismaOrderRepository } from "../infrastructure/prisma/repository/prisma-order-repository";
import { PrismaOrderItemRepository } from "src/modules/orderItem/infrastructure/prisma/repository/prisma-order-item.repository";
import { OrderService } from "../services/order.service";
import { OrderController } from "./order.controller";

const orderRepository = new PrismaOrderRepository(prisma);
const orderItemRepository = new PrismaOrderItemRepository(prisma);

const orderService = new OrderService(
  prisma,
  orderRepository,
  orderItemRepository
);
const orderController = new OrderController(orderService);

export { orderController };