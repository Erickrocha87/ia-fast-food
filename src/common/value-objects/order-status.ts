import z from "zod";
import { OrderStatus } from "../enums/orderStatus";


const statusOrderValidation = z.nativeEnum(OrderStatus);
const statusOrderQueryValidation = z.array(z.nativeEnum(OrderStatus));

export { statusOrderQueryValidation, statusOrderValidation };