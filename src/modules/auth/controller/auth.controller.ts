import { FastifyReply, FastifyRequest } from "fastify";
import { hashPassword, verifyPassword } from "src/common/utils/hash";

import { authUserSchema, createUserSchema } from "../schema/user.schema";
import { AuthRepository } from "../insfrastructure/prisma/auth.repository";

export class AuthController {
  constructor(private authRepository: AuthRepository) {}

  createUser = async (req: FastifyRequest, res: FastifyReply) => {
    const { email, restaurantName, password } = createUserSchema.parse(req.body);

    const existUser = await this.authRepository.findUserByEmail(email);
    if (existUser) {
      return res.status(409).send({ message: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);

    const user = await this.authRepository.registerUser({
      email,
      restaurantName,
      password: hashedPassword,
    });

    res.status(201).send(user);
  };

  login = async (req: FastifyRequest, res: FastifyReply) => {
    const { email, password } = authUserSchema.parse(req.body);

    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      return res.status(409).send({ message: "User not found" });
    }

    const isPasswordValid = await verifyPassword(password, user.password!);

    if (!isPasswordValid) {
      return res.status(401).send({ message: "Invalid password" });
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const token = await res.jwtSign(tokenPayload, { expiresIn: "7d" });
    
    return res.status(200).send({ token });
  };
}
