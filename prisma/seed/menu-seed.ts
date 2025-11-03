import { PrismaClient } from '@prisma/client';

import { menuDTO } from './fixtures/menu-dto';

export async function seedMenu(prisma: PrismaClient) {
  try {
    for (const item of menuDTO) {
        await prisma.menuItem.create({
          data: item,
        });
      }
    console.log('Menu criado com sucesso ✅');
    } catch (error) {
    console.log('Erro ao criar menu ❌', error);
  } finally {
    await prisma.$disconnect();
  }
}
