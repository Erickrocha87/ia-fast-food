import { statusOrderValidation } from 'src/common/value-objects/order-status';
import { z } from 'zod';

const orderSchema = z.object({
    orderStatus: statusOrderValidation,
    total:  z.coerce.number().min(0).optional(),
    tableNumber: z.number().optional(),
})

const createOrderSchema = orderSchema.extend({
    //orderItems: orderItemSchema.array().optional()
})