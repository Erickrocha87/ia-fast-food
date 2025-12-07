import { prisma } from "src/infrastructure/database";

export class TokenService {
  /**
   * Debita tokens da assinatura ativa do usuário
   */
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

    // Se acabou o limite, bloqueia
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

  /**
   * Verifica se o usuário pode gastar tokens
   */
  static async hasTokens(userId: number, needed: number) {
    const s = await prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" }
    });

    if (!s) return false;

    return (s.tokensUsed + needed) <= s.tokensLimit;
  }
}
