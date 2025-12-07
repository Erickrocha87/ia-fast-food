import { prisma } from "src/infrastructure/database";

export class UserRepository {
  async findAll() {
    return prisma.user.findMany({
      include: {
        subscriptions: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  async findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: {
            plan: true,
          },
        },
      },
    });
  }
}
