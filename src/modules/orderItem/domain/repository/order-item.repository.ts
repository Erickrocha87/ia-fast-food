import { IOrderItem } from "../model/order-item.type";

export interface IOrderItemRepository {
  findByOrderAndMenu(orderId: number, menuItemId: number): Promise<IOrderItem | null>;
  create(orderId: number, menuItemId: number, price: number, quantity: number): Promise<IOrderItem>;
  updateQuantity(id: number, quantity: number): Promise<IOrderItem>;
  delete(id: number): Promise<void>;
  listByOrder(orderId: number): Promise<IOrderItem[]>;
}