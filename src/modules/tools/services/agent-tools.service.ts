import { prisma } from "src/infrastructure/database";
import { PrismaMenuRepository } from "src/modules/menu/infrastructure/prisma/repositories/prisma-menu-repository";
import { MenuService } from "src/modules/menu/services/menu.service";
import { PrismaOrderRepository } from "src/modules/order/infrastructure/prisma/repository/prisma-order-repository";
import { OrderService } from "src/modules/order/services/order.service";
import { IOrderItemRepository } from "src/modules/orderItem/domain/repository/order-item.repository";
import { PrismaOrderItemRepository } from "src/modules/orderItem/infrastructure/prisma/repository/prisma-order-item.repository";

const orderItemRepository = new PrismaOrderItemRepository(prisma);
const orderRepository = new PrismaOrderRepository(prisma);
const orderService = new OrderService(
  prisma,
  orderRepository,
  orderItemRepository
);
const menuRepository = new PrismaMenuRepository(prisma);
const menuService = new MenuService(menuRepository);

export const restaurantTools = {
  add_to_order: async ({ tableNumber, menuItemId, quantity }) => {
    if (!tableNumber) return { ok: false, error: "tableNumber é obrigatório" };
    if (!menuItemId) return { ok: false, error: "menuItemId é obrigatório" };

    const qty = Number(quantity || 1);
    if (qty <= 0) return { ok: false, error: "Quantidade inválida" };

    const order = await orderService.findOrCreateOpen(String(tableNumber));

    const item = await prisma.menuItem.findUnique({
      where: { id: Number(menuItemId) },
    });
    if (!item) return { ok: false, error: "Item do cardápio não existe" };

    await orderService.addItem({
      orderId: order.id,
      menuItemId: Number(menuItemId),
      quantity: qty,
    });

    return { ok: true, message: `Adicionado ${qty}x ${item.name}` };
  },

  remove_from_order: async ({ tableNumber, menuItemId, quantity }) => {
    if (!tableNumber) return { ok: false, error: "tableNumber é obrigatório" };
    if (!menuItemId) return { ok: false, error: "menuItemId é obrigatório" };

    const qty = Number(quantity || 1);

    const order = await orderService.findOrCreateOpen(String(tableNumber));

    await orderService.removeItem({
      orderId: order.id,
      menuItemId: Number(menuItemId),
      quantity: qty,
    });

    return { ok: true };
  },

  get_order_summary: async ({ tableNumber }) => {
    if (!tableNumber) return { ok: false, error: "tableNumber é obrigatório" };

    const order = await orderService.findOrCreateOpen(String(tableNumber));
    const summary = await orderService.getSummary(order.id);

    return summary;
  },

  list_menu_items: async ({ query }) => {
    const q = String(query || "").toLowerCase();

    const items = await prisma.menuItem.findMany();

    const filtered = q
      ? items.filter((i) => i.name?.toLowerCase().includes(q))
      : items;

    return { items: filtered };
  },
};
