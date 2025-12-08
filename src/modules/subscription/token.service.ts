import { prisma } from "src/infrastructure/database";

export class TokenService {
  static async consumeTokens(userId: number, amount: number) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE"
      },
      include: { plan: true }
    });

    if (!subscription) {
      throw new Error("Usuário não possui assinatura ativa.");
    }

    if (subscription.tokensUsed + amount > subscription.tokensLimit) {
      throw new Error("Limite de tokens atingido.");
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        tokensUsed: {
          increment: amount
        }
      }
    });

    return true;
  }

  static async hasTokens(userId: number, needed: number) {
    const s = await prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" }
    });

    if (!s) return false;

    return (s.tokensUsed + needed) <= s.tokensLimit;
  }
}
