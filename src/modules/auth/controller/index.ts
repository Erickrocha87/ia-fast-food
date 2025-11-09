
import { AuthController } from "./auth.controller";
import { AuthRepository } from "../insfrastructure/prisma/auth.repository";
import { prisma } from "src/infrastructure/database";

const authRepository = new AuthRepository(prisma);

const authController = new AuthController(authRepository);

export { authController };