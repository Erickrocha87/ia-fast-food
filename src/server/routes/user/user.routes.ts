import { FastifyInstance } from "fastify";
import { UserController } from "src/modules/users/user.controller";
import { UserRepository } from "src/modules/users/user.repository";

export async function userRoutes(app: FastifyInstance) {
  const userRepository = new UserRepository();
  const userController = new UserController(userRepository);

  app.get("/users", userController.getAllUsers);
  app.get("/users/:id", userController.getUserById);
}
