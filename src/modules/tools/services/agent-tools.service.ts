import { z } from "zod";
import { prisma } from "src/infrastructure/database";
import { OrderService } from "src/modules/order/services/order.service";
import { PrismaOrderRepository } from "src/modules/order/infrastructure/prisma/repository/prisma-order-repository";
import { PrismaOrderItemRepository } from "src/modules/orderItem/infrastructure/prisma/repository/prisma-order-item.repository";
import { MenuService } from "src/modules/menu/services/menu.service";
import { PrismaMenuRepository } from "src/modules/menu/infrastructure/prisma/repositories/prisma-menu-repository";



const orderService = new OrderService(
  prisma,
  new PrismaOrderRepository(prisma),
  new PrismaOrderItemRepository(prisma)
);

const menuService = new MenuService(new PrismaMenuRepository(prisma));


export const addToOrderDefinition = {
  name: "add_to_order",
  description:
    "Cria/associa um pedido aberto para a mesa (se necessário) e adiciona o item com a quantidade informada.",
  parameters: z.object({
    tableNumber: z.string().describe("Número/código da mesa. Ex: '12'"),
    orderId: z.number().int().nullable().describe("ID do pedido, se já existir."),
    menuItemId: z.number().int().describe("ID do item no cardápio."),
    quantity: z.number().int().min(1).describe("Quantidade a adicionar."),
  }),
};

export const removeFromOrderDefinition = {
  name: "remove_from_order",
  description:
    "Remove (decrementa) quantidade de um item do pedido. Remove totalmente se a quantidade chegar a zero.",
  parameters: z.object({
    orderId: z.number().int().describe("ID do pedido."),
    menuItemId: z.number().int().describe("ID do item no cardápio."),
    quantity: z.number().int().min(1).describe("Quantidade a remover."),
  }),
};

export const listMenuItemsDefinition = {
  name: "list_menu_items",
  description:
    "Lista os itens disponíveis no cardápio, opcionalmente filtrando por uma palavra-chave ou categoria.",
  parameters: z.object({
    query: z
      .string()
      .nullable()
      .describe("Palavra-chave para filtrar itens. Ex: 'hambúrguer', 'batata', 'café'"),
  }),
};

export const getOrderSummaryDefinition = {
  name: "get_order_summary",
  description: "Resumo do pedido com itens, subtotais e total.",
  parameters: z.object({
    orderId: z.number().int(),
  }),
};

export const toolDefinitions = [
  addToOrderDefinition,
  removeFromOrderDefinition,
  getOrderSummaryDefinition,
  listMenuItemsDefinition,
];

async function addToOrderImplementation({
  tableNumber,
  orderId,
  menuItemId,
  quantity,
}: {
  tableNumber: string;
  orderId: number | null;
  menuItemId: number;
  quantity: number;
}) {
  const order =
    orderId != null
      ? await orderService.getById(orderId)
      : await orderService.findOrCreateOpen(tableNumber);

  const updatedOrder = await orderService.addItem({
    orderId: order.id,
    menuItemId,
    quantity,
  });

  const summary = await orderService.getSummary(updatedOrder.id);

  return {
    success: true,
    message: `${quantity}x adicionado.`,
    orderId: updatedOrder.id,
    status: updatedOrder.status,
    total: updatedOrder.total,
    items: summary.items,
  };
}

async function removeFromOrderImplementation({
  orderId,
  menuItemId,
  quantity,
}: {
  orderId: number;
  menuItemId: number;
  quantity: number;
}) {
  const updatedOrder = await orderService.removeItem({ orderId, menuItemId, quantity });
  const summary = await orderService.getSummary(updatedOrder.id);

  return {
    success: true,
    message: `${quantity}x removido.`,
    orderId: updatedOrder.id,
    status: updatedOrder.status,
    total: updatedOrder.total,
    items: summary.items,
  };
}

async function getOrderSummaryImplementation({ orderId }: { orderId: number }) {
  return orderService.getSummary(orderId);
}

async function listMenuItemsImplementation({
  query,
}: {
  query: string | null;
}) {
  const allItems = await menuService.findAll();

  const q = query?.toLowerCase() ?? "";
  const filtered = allItems.filter(
    (item) =>
      !q ||
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
  );

  // map para forma simples (menos tokens na IA)
  const items = filtered.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    price: m.price ? Number(m.price).toFixed(2) : null,
  }));

  if (items.length === 0) {
    return {
      message:
        query && query.trim() !== ""
          ? `Nenhum item encontrado para "${query}".`
          : "Nenhum item encontrado no cardápio.",
      items: [],
    };
  }

  return {
    message: query
      ? `Itens encontrados para "${query}":`
      : "Itens disponíveis no cardápio:",
    items,
  };
}

export async function buildQuickMenuSummary(limit = 10): Promise<string> {
  const items = await prisma.menuItem.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  if (items.length === 0) {
    return "O cardápio está vazio no momento.";
  }

  return (
    "Cardápio atualizado:\n" +
    items
      .map(
        (item) =>
          `• ${item.name ?? "Item sem nome"} — R$ ${
            item.price != null ? Number(item.price).toFixed(2) : "s/ preço"
          }${item.description ? ` — ${item.description}` : ""}`
      )
      .join("\n")
  );
}

export const toolImplementations = new Map<string, Function>([
  [addToOrderDefinition.name, addToOrderImplementation],
  [removeFromOrderDefinition.name, removeFromOrderImplementation],
  [getOrderSummaryDefinition.name, getOrderSummaryImplementation],
  [listMenuItemsDefinition.name, listMenuItemsImplementation],
]);
