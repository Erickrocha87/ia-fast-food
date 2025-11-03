import { PrismaClient } from "@prisma/client";
import { IOrderItem } from "src/modules/orderItem/domain/model/order-item.type";
import { IOrderItemRepository } from "src/modules/orderItem/domain/repository/order-item.repository";

export class PrismaOrderItemRepository implements IOrderItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByOrderAndMenu(orderId: number, menuItemId: number): Promise<IOrderItem | null> {
    const row = await this.prisma.orderItem.findFirst({
      where: { orderId, menuItemId },
    });
    return row;
  }

  async create(orderId: number, menuItemId: number, price: number, quantity: number): Promise<IOrderItem> {
    const row = await this.prisma.orderItem.create({
      data: { orderId, menuItemId, price, quantity },
    });
    return row;
  }

  async updateQuantity(id: number, quantity: number): Promise<IOrderItem> {
    const row = await this.prisma.orderItem.update({
      where: { id },
      data: { quantity },
    });
    return row;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.orderItem.delete({ where: { id } });
  }

  async listByOrder(orderId: number): Promise<IOrderItem[]> {
    const rows = await this.prisma.orderItem.findMany({ where: { orderId } });
    return rows;
  }
}