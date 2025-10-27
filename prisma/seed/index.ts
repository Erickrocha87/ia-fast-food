import { seedMenu } from "./menu-seed";

import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();

  await seedMenu(prisma);
}

main().then(() => {
    console.log('Seed finalizado com sucesso');
  })
  .catch((error) => {
    console.error('Erro durante o seed:', error);
    process.exit(1);
  });