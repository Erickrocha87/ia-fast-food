export interface MenuItem {
  name: string;
  price: number;
  description?: string;
}

export interface OrderItem {
  name: string;
  price: number;
  qty: number;
}

export const menu: MenuItem[] = [];
export const order: Map<string, OrderItem> = new Map();

export function renderOrder() {
  console.log("Pedido atual:", [...order.values()]);
}
