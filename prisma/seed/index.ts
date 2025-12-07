import { seedMenu } from "./menu-seed";

import { PrismaClient } from "@prisma/client";
import { seedPlan } from "./plan-seed";

async function main() {
  const prisma = new PrismaClient();

  await seedMenu(prisma);
  await seedPlan(prisma);
}

main().then(() => {
    console.log('Seed finalizado com sucesso');
  })
  .catch((error) => {
    console.error('Erro durante o seed:', error);
    process.exit(1);
  });