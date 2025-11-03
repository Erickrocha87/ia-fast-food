import { z } from 'zod';

const orderItemSchema = z.object({
  quantity: z.number(),
  menuItemId: z.number()
});

const createOrderItemSchema = z.object({
  orderId: z.string(),
});

export { createOrderItemSchema, orderItemSchema };