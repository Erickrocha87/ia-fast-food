import { IOrderItem } from "../model/order-item.type";

interface OrderItemDTO extends Omit<IOrderItem, "id" | "createdAt" | "updatedAt">{
    menuItemId: number;
    orderId: number;
} 

type OrderInputDTO = Partial<OrderItemDTO>;

export type AddOrderItemDTO = {
  orderId: number;
  menuItemId: number;
  quantity: number;
};

export type RemoveOrderItemDTO = {
  orderId: number;
  menuItemId: number;
  quantity: number;
};

export { OrderItemDTO, OrderInputDTO };