import { FastifyInstance } from "fastify";
import { authController } from "src/modules/auth/controller";

const authRoutes = (app: FastifyInstance) => {
    app.post("/register", authController.createUser);

    app.post("/login", authController.login);
}

export { authRoutes };