import { z } from 'zod';

const menuSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    price: z.coerce.number().min(0),
});

const createMenuBodySchema = menuSchema;

export { createMenuBodySchema };