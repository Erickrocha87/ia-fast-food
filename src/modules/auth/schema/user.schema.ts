import z from "zod"

const createUserSchema = z.object({
    email: z.string().email(),
    restaurantName: z.string().min(2).max(100),
    password: z.string().min(6).max(100),
});

const authUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(100),
});

export { createUserSchema, authUserSchema }