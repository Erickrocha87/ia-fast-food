import { z } from "zod";
import { CsvService } from "../../../csv/services/csv.service";

// TODO: DADOS MOCKADOS
const order = new Map<string, { name: string, price: number, qty: number }>();
const renderOrder = () => console.log("Pedido atualizado:", ...order.values());
const csvService = new CsvService();
const menu = csvService.readCsv();

export const addToOrderDefinition = {
  name: "add_to_order",
  description: "Adiciona um item ao pedido atual do cliente",
  parameters: z.object({
    name: z.string().describe("O nome exato do item do menu a ser adicionado"),
    quantity: z.number().int().min(1).nullable().describe("A quantidade do item a ser adicionada. O padrão é 1."),
  }),
};

export const removeFromOrderDefinition = {
  name: "remove_from_order",
  description: "Remove uma quantidade de um item do pedido atual",
  parameters: z.object({
    name: z.string().describe("O nome exato do item a ser removido do pedido"),
    quantity: z.number().int().min(1).nullable().describe("A quantidade a ser removida. O padrão é 1."),
  }),
};

export const getOrderSummaryDefinition = {
  name: "get_order_summary",
  description: "Retorna um resumo completo do pedido atual, incluindo itens, quantidades, subtotais e o valor total",
  parameters: z.object({}),
};

export const listMenuItemsDefinition = {
  name: "list_menu_items",
  description: "Lista os itens disponíveis no cardápio de forma clara e resumida, opcionalmente filtrando por uma palavra-chave",
  parameters: z.object({
    query: z.string().nullable().describe("Palavra-chave para filtrar os itens do menu. Ex: 'café'"),
  }),
};

export const toolDefinitions = [
  addToOrderDefinition,
  removeFromOrderDefinition,
  getOrderSummaryDefinition,
  listMenuItemsDefinition,
];

async function addToOrderImplementation({ name, quantity }: { name: string, quantity: number | null }) {
  const item = menu.find((m) => m.name.toLowerCase() === name.toLowerCase());
  if (!item) throw new Error(`Item "${name}" não encontrado no cardápio.`);
  
  const prev = order.get(item.name) || { name: item.name, price: item.price, qty: 0 };
  prev.qty += quantity ?? 1;
  order.set(item.name, prev);
  renderOrder();
  return { success: true, message: `${quantity ?? 1} ${name} adicionado(s) ao pedido.` };
}

async function removeFromOrderImplementation({ name, quantity }: { name: string, quantity: number | null }) {
  const key = [...order.keys()].find((k) => k.toLowerCase() === name.toLowerCase());
  if (!key) throw new Error(`Item "${name}" não está no pedido.`);
  
  const row = order.get(key)!;
  const qtyToRemove = quantity ?? 1;
  row.qty -= qtyToRemove;
  
  if (row.qty <= 0) {
    order.delete(key);
    renderOrder();
    return { success: true, message: `Item ${name} removido completamente do pedido.` };
  } else {
    order.set(key, row);
    renderOrder();
    return { success: true, message: `${qtyToRemove} ${name} removido(s) do pedido. Restam ${row.qty}.` };
  }
}

async function getOrderSummaryImplementation() {
  const items = [...order.values()].map(({ name, price, qty }) => ({
    name,
    price,
    qty,
    subtotal: price * qty,
  }));
  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  return { items, total };
}

async function listMenuItemsImplementation({ query }: { query: string | null }) {
  const q = query?.toLowerCase() ?? "";
  const items = menu.filter((m) => !q || m.name.toLowerCase().includes(q));
  return { items };
}


 //serviço para encontrar e executar a função correta
export const toolImplementations = new Map<string, Function>([
  [addToOrderDefinition.name, addToOrderImplementation],
  [removeFromOrderDefinition.name, removeFromOrderImplementation],
  [getOrderSummaryDefinition.name, getOrderSummaryImplementation],
  [listMenuItemsDefinition.name, listMenuItemsImplementation],
]);