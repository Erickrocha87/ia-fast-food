import { PrismaClient } from "@prisma/client";

export async function seedPlan(prisma: PrismaClient) {
  try {
    await prisma.plan.upsert({
      where: { slug: "basico" },
      update: {},
      create: {
        slug: "basico",
        name: "Básico",
        description: "Ideal para restaurantes pequenos começarem com IA.",
        tokensPerMonth: 500_000,
        maxTablets: 5,
        priceMonthly: 12990, // 129,90
        priceYearly: 129990, // 1299,90
      },
    });

    await prisma.plan.upsert({
      where: { slug: "profissional" },
      update: {},
      create: {
        slug: "profissional",
        name: "Profissional",
        description: "Perfeito para restaurantes médios com mais movimento.",
        tokensPerMonth: 1_800_000,
        maxTablets: 15,
        priceMonthly: 24990, // 249,90
        priceYearly: 249990, // 2499,90
      },
    });

    await prisma.plan.upsert({
      where: { slug: "premium" },
      update: {},
      create: {
        slug: "premium",
        name: "Premium",
        description: "Para redes e casas com alto volume de pedidos.",
        tokensPerMonth: 5_000_000,
        maxTablets: null, // ilimitado
        priceMonthly: 49990, // 499,90
        priceYearly: 499990, // 4999,90
      },
    });

    console.log("✅ Planos seedados com sucesso");
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
