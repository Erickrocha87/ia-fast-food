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
];
