import { prisma } from '../src/db.js';
import { seedCatalogInto, seedRolesInto } from '../prisma/seed-data.js';

/** Empties every table and re-seeds roles and the catalog. */
export async function resetDatabase() {
  await prisma.$executeRawUnsafe('TRUNCATE "Session", "AdminUser", "Role", "ProductImage", "Product", "Category" RESTART IDENTITY CASCADE');
  await seedRolesInto(prisma);
  await seedCatalogInto(prisma);
}

/** Recursively checks that no object anywhere in a JSON value has a `price` key. */
export function containsPriceKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsPriceKey);
  if (value && typeof value === 'object') return Object.entries(value).some(([key, inner]) => key === 'price' || containsPriceKey(inner));
  return false;
}

export { prisma };
