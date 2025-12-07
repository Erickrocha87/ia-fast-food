import { FastifyReply, FastifyRequest } from "fastify";
import { UserRepository } from "./user.repository";

export class UserController {
  constructor(private userRepository: UserRepository) {}

  getAllUsers = async (req: FastifyRequest, res: FastifyReply) => {
    try {
      const users = await this.userRepository.findAll();
      return res.send(users);
    } catch (err) {
      console.error(err);
      return res.status(500).send({ message: "Erro ao listar usuários" });
    }
  };

  getUserById = async (req: FastifyRequest, res: FastifyReply) => {
    try {
      const id = Number((req.params as any).id);
      if (isNaN(id)) {
        return res.status(400).send({ message: "ID inválido" });
      }

      const user = await this.userRepository.findById(id);
      if (!user) {
        return res.status(404).send({ message: "Usuário não encontrado" });
      }

      return res.send(user);
    } catch (err) {
      console.error(err);
      return res.status(500).send({ message: "Erro ao buscar usuário" });
    }
  };
}
