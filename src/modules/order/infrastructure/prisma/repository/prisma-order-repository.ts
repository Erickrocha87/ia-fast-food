import { PrismaClient, OrderStatus } from "@prisma/client";
import { OrderCreateDTO, OrderInputDTO, UpdateOrderStatusDTO } from "src/modules/order/domain/dto/order";
import { IOrder } from "src/modules/order/domain/model/order.type";
import { IOrderRepository } from "src/modules/order/domain/repositories/order.repository";

export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createEmpty(data: OrderCreateDTO): Promise<IOrder> {
    const row = await this.prisma.order.create({
      data: {
        tableNumber: data.tableNumber,
        status: OrderStatus.Open,
        total: 0,
      },
    });
    return row as unknown as IOrder;
  }

  async create(data: OrderInputDTO): Promise<IOrder> {
    const itemIds = data.orderItems.map((i) => i.menuItemId);

    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, price: true },
    });

    const priceMap = new Map(menuItems.map((m) => [m.id, Number(m.price ?? 0)]));

    let calculatedTotal = 0;
    const orderItemsData = data.orderItems.map((i) => {
      const price = priceMap.get(i.menuItemId);
      if (price == null || price <= 0) {
        throw new Error(`Item do menu ${i.menuItemId} não encontrado ou com preço inválido.`);
      }
      calculatedTotal += price * i.quantity;
      return {
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        price,
      };
    });

    const order = await this.prisma.order.create({
      data: {
        tableNumber: data.tableNumber,
        status: OrderStatus.Open,
        total: calculatedTotal,
        orderItems: { create: orderItemsData },
      },
      include: { orderItems: true },
    });

    return order as unknown as IOrder;
  }

  async findAll(): Promise<IOrder[]> {
    const rows = await this.prisma.order.findMany({ include: { orderItems: true } });
    return rows as unknown as IOrder[];
  }

  async findById(id: number): Promise<IOrder | null> {
    const row = await this.prisma.order.findFirst({
      where: { id },
      include: { orderItems: true },
    });
    return row as unknown as IOrder | null;
  }

  async findOpenByTable(tableNumber: string): Promise<IOrder | null> {
    const row = await this.prisma.order.findFirst({
      where: { tableNumber, status: OrderStatus.Open },
      include: { orderItems: true },
    });
    return row as unknown as IOrder | null;
  }

  async updateStatus(id: number, data: UpdateOrderStatusDTO): Promise<IOrder> {
    const status =
      data.status === "Paid"
        ? OrderStatus.Paid
        : data.status === "Canceled"
        ? OrderStatus.Canceled
        : OrderStatus.Open;

    const row = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { orderItems: true },
    });
    return row as unknown as IOrder;
  }

  async updateTotal(id: number, total: number): Promise<IOrder> {
    const row = await this.prisma.order.update({
      where: { id },
      data: { total },
      include: { orderItems: true },
    });
    return row as unknown as IOrder;
  }
}
