import { tool } from "@openai/agents";
import { z } from "zod";
import { menu, order, renderOrder } from "../../../common/@types/order-state";

export const addToOrderTool = tool({
  name: "add_to_order",
  description: "Adiciona um item ao pedido atual",
  parameters: z.object({
    name: z.string(),
    quantity: z.number().int().min(1).nullable(),
  }),
  async execute({ name, quantity }) {
    const item = menu.find((m) => m.name.toLowerCase() === name.toLowerCase());
    if (!item) throw new Error(`Item "${name}" não encontrado`);
    const prev = order.get(item.name) || { name: item.name, price: item.price, qty: 0 };
    prev.qty += quantity ?? 1;
    order.set(item.name, prev);
    renderOrder();
    return { ok: true, line: prev };
  },
});

export const removeFromOrderTool = tool({
  name: "remove_from_order",
  description: "Remove quantidade de um item do pedido",
  parameters: z.object({
    name: z.string(),
    quantity: z.number().int().min(1).nullable(),
  }),
  async execute({ name, quantity }) {
    const key = [...order.keys()].find((k) => k.toLowerCase() === name.toLowerCase());
    if (!key) throw new Error(`Item "${name}" não está no pedido`);
    const row = order.get(key)!;
    row.qty -= quantity ?? 1;
    if (row.qty <= 0) order.delete(key);
    else order.set(key, row);
    renderOrder();
    return { ok: true };
  },
});

export const getOrderSummaryTool = tool({
  name: "get_order_summary",
  description: "Retorna resumo do pedido com total",
  parameters: z.object({}),
  async execute() {
    const items = [...order.values()].map(({ name, price, qty }) => ({
      name,
      price,
      qty,
      subtotal: price * qty,
    }));
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);
    return { items, total };
  },
});

export const listMenuItemsTool = tool({
  name: "list_menu_items",
  description: "Lista itens do menu, opcionalmente filtrados por nome",
  parameters: z.object({
    query: z.string().nullable(),
  }),
  async execute({ query }) {
    const q = query?.toLowerCase() ?? "";
    const items = menu.filter((m) => !q || m.name.toLowerCase().includes(q));
    return { items };
  },
});

export const agentTools = [
  addToOrderTool,
  removeFromOrderTool,
  getOrderSummaryTool,
  listMenuItemsTool,
];
