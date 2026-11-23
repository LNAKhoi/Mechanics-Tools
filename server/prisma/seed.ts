import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { seedCatalogInto, seedRolesInto } from './seed-data.js';

const prisma = new PrismaClient();

try {
  await seedRolesInto(prisma);
  await seedCatalogInto(prisma);
  const [categories, products] = await Promise.all([prisma.category.count(), prisma.product.count()]);
  console.log(`Seeded ${categories} categories and ${products} products.`);
} finally {
  await prisma.$disconnect();
}
