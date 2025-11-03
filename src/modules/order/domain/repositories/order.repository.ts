import { OrderCreateDTO, OrderDTO, OrderInputDTO, UpdateOrderStatusDTO } from "../dto/order";
import { IOrder } from "../model/order.type";


export interface IOrderRepository {
  createEmpty(data: OrderCreateDTO): Promise<IOrder>;
  create(data: OrderInputDTO): Promise<IOrder>;
  findAll(): Promise<IOrder[]>;
  findById(id: number): Promise<IOrder | null>;
  findOpenByTable(tableNumber: string): Promise<IOrder | null>;
  updateStatus(id: number, data: UpdateOrderStatusDTO): Promise<IOrder>;
  updateTotal(id: number, total: number): Promise<IOrder>;
}