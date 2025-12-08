// src/modules/tools/services/index.ts (ou arquivo equivalente)
import { prisma } from "src/infrastructure/database";
import { PrismaMenuRepository } from "src/modules/menu/infrastructure/prisma/repositories/prisma-menu-repository";
import { MenuService } from "src/modules/menu/services/menu.service";
import { PrismaOrderRepository } from "src/modules/order/infrastructure/prisma/repository/prisma-order-repository";
import { OrderService } from "src/modules/order/services/order.service";
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
    if (!tableNumber) return { ok: false, message: "Mesa inválida." };
    if (!menuItemId) return { ok: false, message: "Item inválido." };

    const qty = Number(quantity || 1);
    if (qty <= 0) return { ok: false, message: "Quantidade inválida." };

    const order = await orderService.findOrCreateOpen(String(tableNumber));

    const item = await prisma.menuItem.findUnique({
      where: { id: Number(menuItemId) },
    });
    if (!item) return { ok: false, message: "Item do cardápio não existe." };

    await orderService.addItem({
      orderId: order.id,
      menuItemId: Number(menuItemId),
      quantity: qty,
    });

    return {
      ok: true,
      message: `Adicionei ${qty}x ${item.name} ao seu pedido.`,
      orderId: order.id,
    };
  },

  remove_from_order: async ({ tableNumber, menuItemId, quantity }) => {
    if (!tableNumber) return { ok: false, message: "Mesa inválida." };
    if (!menuItemId) return { ok: false, message: "Item inválido." };

    const qty = Number(quantity || 1);

    const order = await orderService.findOrCreateOpen(String(tableNumber));

    const item = await prisma.menuItem.findUnique({
      where: { id: Number(menuItemId) },
    });

    await orderService.removeItem({
      orderId: order.id,
      menuItemId: Number(menuItemId),
      quantity: qty,
    });

    if (!item) {
      return {
        ok: true,
        message: `Atualizei a quantidade do item selecionado no seu pedido.`,
        orderId: order.id,
      };
    }

    return {
      ok: true,
      message: `Removi ${qty}x ${item.name} do seu pedido.`,
      orderId: order.id,
    };
  },

  parse_items_from_speech: async ({ text }: { text?: string }) => {
    if (!text) {
      return {
        ok: false,
        message: "Nenhuma frase recebida.",
        items: [] as any[],
      };
    }

    const items = await prisma.menuItem.findMany();
    const lower = text.toLowerCase();

    const matches: { menuItemId: number; quantity: number; name: string }[] =
      [];

    for (const item of items) {
      const originalName = item.name ?? "";
      if (!originalName) continue;

      const name = originalName.toLowerCase();

      if (lower.includes(name)) {
        // extrair quantidade básica
        let qty = 1;

        const qtyMatch = lower.match(
          new RegExp(`(\\d+)\\s*(x|unidade|unidades|vezes)?\\s*${name}`)
        );

        if (qtyMatch) qty = Number(qtyMatch[1]) || 1;

        matches.push({
          menuItemId: item.id,
          quantity: qty,
          name: originalName,
        });
      }
    }

    if (matches.length === 0) {
      return {
        ok: false,
        message: "Não identifiquei itens do cardápio na frase.",
        items: [],
      };
    }

    const msgLista = matches.map((m) => `${m.quantity}x ${m.name}`).join(", ");

    return {
      ok: true,
      message: `Detectei ${matches.length} item(ns): ${msgLista}`,
      items: matches,
    };
  },

  finalize_order: async ({ tableNumber }: { tableNumber?: string }) => {
    if (!tableNumber) {
      return { ok: false, message: "Mesa inválida." };
    }

    const order = await orderService.findOrCreateOpen(String(tableNumber));
    const summary = await orderService.getSummary(order.id);

    const items = summary.items || [];
    if (!items.length) {
      return {
        ok: false,
        message: `O pedido da mesa ${tableNumber} está vazio, nada foi enviado para a cozinha.`,
        orderId: order.id,
        summary,
      };
    }

    // Se quiser no futuro mexer em status, faz aqui.
    // Por enquanto só confirma o envio.
    return {
      ok: true,
      message: `O pedido da mesa ${tableNumber} foi enviado para a cozinha. Assim que estiver pronto, avisaremos.`,
      orderId: order.id,
      summary,
    };
  },

  get_order_summary: async ({ tableNumber }) => {
    if (!tableNumber) return { ok: false, message: "Mesa inválida." };

    const order = await orderService.findOrCreateOpen(String(tableNumber));
    const summary = await orderService.getSummary(order.id);

    const items = summary.items || [];
    const total = summary.total || 0;

    if (!items.length) {
      return {
        ok: true,
        message: `No momento o pedido da mesa ${tableNumber} está vazio.`,
        summary,
        orderId: order.id,
      };
    }

    const itensTexto = items
      .map((i: any) => `${i.quantity}x ${i.name}`)
      .join(", ");

    const totalFormatado = Number(total).toFixed(2).replace(".", ",");

    const message = `Seu pedido atual tem ${items.length} item(ns): ${itensTexto}. O total é R$ ${totalFormatado}.`;

    return {
      ok: true,
      message,
      summary,
      orderId: order.id,
    };
  },

  list_menu_items: async ({ query }) => {
    const q = String(query || "").toLowerCase();

    const items = await menuService.getAllMenuItemsCached();

    const filtered = q
      ? items.filter(
          (i: any) =>
            i.name?.toLowerCase().includes(q) ||
            i.description?.toLowerCase().includes(q)
        )
      : items;

    if (!filtered.length) {
      return {
        ok: true,
        message: `Não encontrei itens para "${q || "cardápio"}".`,
        items: [],
      };
    }

    const nomes = filtered.map((i: any) => i.name).join(", ");
    const message = q
      ? `As opções de ${q} são: ${nomes}.`
      : `No cardápio temos: ${nomes}.`;

    return {
      ok: true,
      message,
      items: filtered,
    };
  },
};

export const toolDefinitions = [
  {
    type: "function",
    name: "add_to_order",
    description: "Adiciona um item no pedido da mesa.",
    parameters: {
      type: "object",
      properties: {
        tableNumber: { type: "string" },
        menuItemId: { type: "number" },
        quantity: { type: "number" },
      },
      required: ["tableNumber", "menuItemId"],
    },
  },
  {
    type: "function",
    name: "remove_from_order",
    description: "Remove quantidade de um item do pedido.",
    parameters: {
      type: "object",
      properties: {
        tableNumber: { type: "string" },
        menuItemId: { type: "number" },
        quantity: { type: "number" },
      },
      required: ["tableNumber", "menuItemId"],
    },
  },
  {
    type: "function",
    name: "get_order_summary",
    description: "Retorna resumo completo do pedido da mesa.",
    parameters: {
      type: "object",
      properties: {
        tableNumber: { type: "string" },
      },
      required: ["tableNumber"],
    },
  },
  {
    type: "function",
    name: "list_menu_items",
    description: "Lista itens do cardápio, opcionalmente filtrados.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
    },
  },
  {
    type: "function",
    name: "parse_items_from_speech",
    description:
      "Extrai múltiplos itens mencionados na fala e suas quantidades com base no cardápio.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string" },
        tableNumber: { type: "string" },
      },
      required: ["text"],
    },
  },
  {
    type: "function",
    name: "finalize_order",
    description:
      "Finaliza o pedido atual da mesa e considera que ele foi enviado para a cozinha.",
    parameters: {
      type: "object",
      properties: {
        tableNumber: { type: "string" },
      },
      required: ["tableNumber"],
    },
  },
];
