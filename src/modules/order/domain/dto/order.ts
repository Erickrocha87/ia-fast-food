import { orderItemSchema } from "src/modules/orderItem/schema/orderItem.schema";
import { IOrder } from "../model/order.type";
import z from "zod";
import { OrderStatus } from "src/common/enums/orderStatus";

interface OrderDTO extends Omit<IOrder, "id" | "createdAt" | "updatedAt" | "status"> {
    orderItems: { id?: string } & z.infer<typeof orderItemSchema>[];
}

type OrderInputDTO = OrderDTO;

interface UpdateOrderStatusDTO {
  status?: OrderStatus;
}

export type OrderCreateDTO = {
  tableNumber: string;
};

export { OrderDTO, OrderInputDTO, UpdateOrderStatusDTO };