import { PrismaClient } from '@prisma/client';

// Test workers must never inherit the development database from `.env`.
const testUrl = process.env.NODE_ENV === 'test' ? process.env.TEST_DATABASE_URL : undefined;
export const prisma = new PrismaClient(testUrl ? { datasources: { db: { url: testUrl } } } : undefined);
