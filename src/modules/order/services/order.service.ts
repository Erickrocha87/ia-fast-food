import { PrismaClient } from "@prisma/client";
import { IOrderRepository } from "../domain/repositories/order.repository";
import { IOrderItemRepository } from "src/modules/orderItem/domain/repository/order-item.repository";
import { UpdateOrderStatusDTO } from "../domain/dto/order";
import { AddOrderItemDTO, RemoveOrderItemDTO } from "src/modules/orderItem/domain/dto/order-item";

export class OrderService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly orderRepo: IOrderRepository,
    private readonly orderItemRepo: IOrderItemRepository
  ) {}

 async findOrCreateOpen(tableNumber: string) {
    const existing = await this.orderRepo.findOpenByTable(tableNumber);
    if (existing) return existing;

    return this.orderRepo.createEmpty({ tableNumber });
  }

  async getById(id: number) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new Error(`Pedido ${id} não encontrado.`);
    return order;
  }

  async updateStatus(id: number, data: UpdateOrderStatusDTO) {
    await this.getById(id);
    return this.orderRepo.updateStatus(id, data);
  }

  async addItem(dto: AddOrderItemDTO) {
    return this.prisma.$transaction(async (tx) => {

      const order = await tx.order.findUnique({ where: { id: dto.orderId } });
      if (!order) throw new Error(`Pedido ${dto.orderId} não encontrado.`);

      const menuItem = await tx.menuItem.findUnique({ where: { id: dto.menuItemId } });
      if (!menuItem) throw new Error(`Item do cardápio ${dto.menuItemId} não encontrado.`);
      const price = Number(menuItem.price ?? 0);
      if (price <= 0) throw new Error(`Preço inválido para o item ${dto.menuItemId}.`);

      const existing = await tx.orderItem.findFirst({
        where: { orderId: dto.orderId, menuItemId: dto.menuItemId },
      });

      if (existing) {
        await tx.orderItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity! + dto.quantity },
        });
      } else {
        await tx.orderItem.create({
          data: {
            orderId: dto.orderId,
            menuItemId: dto.menuItemId,
            quantity: dto.quantity,
            price,
          },
        });
      }

      const items = await tx.orderItem.findMany({ where: { orderId: dto.orderId } });
      const total = items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0);
      const updated = await tx.order.update({
        where: { id: dto.orderId },
        data: { total },
      });
      return updated;
    });
  }

  async removeItem(dto: RemoveOrderItemDTO) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.orderItem.findFirst({
        where: { orderId: dto.orderId, menuItemId: dto.menuItemId },
      });
      if (!item) throw new Error(`Item não está no pedido.`);

      const newQty = item.quantity! - dto.quantity;
      if (newQty <= 0) {
        await tx.orderItem.delete({ where: { id: item.id } });
      } else {
        await tx.orderItem.update({ where: { id: item.id }, data: { quantity: newQty } });
      }

      const items = await tx.orderItem.findMany({ where: { orderId: dto.orderId } });
      const total = items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0);
      const updated = await tx.order.update({
        where: { id: dto.orderId },
        data: { total },
      });
      return updated;
    });
  }

  async getSummary(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { include: { menuItem: { select: { name: true } } } },
      },
    });
    if (!order) throw new Error(`Pedido ${orderId} não encontrado.`);

    const items = order.orderItems.map((it) => ({
      name: it.menuItem?.name ?? `#${it.menuItemId}`,
      quantity: it.quantity,
      unitPrice: Number(it.price),
      subtotal: Number(it.price) * Number(it.quantity),
    }));

    return {
      id: order.id,
      tableNumber: order.tableNumber,
      status: order.status,
      total: Number(order.total),
      items,
    };
  }
}
