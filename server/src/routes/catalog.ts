import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db.js';
import { publicCategory, publicProductDetail, publicProductSummary } from '../serializers.js';

export const catalogRouter = Router();

const include = { category: true, images: true } satisfies Prisma.ProductInclude;

catalogRouter.get('/categories', async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], include: { _count: { select: { products: true } } } });
  res.json({ items: categories.map(publicCategory) });
});

const listQuery = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(100000).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
});

catalogRouter.get('/products', async (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Tham số không hợp lệ', fieldErrors: parsed.error.flatten().fieldErrors });
    return;
  }
  const { q, category, page, limit } = parsed.data;
  // `unaccent` is installed by the accompanying Prisma migration.  Use it in
  // SQL rather than normalizing in JavaScript so filtering and pagination stay
  // in PostgreSQL and work for rows added by administrators.
  const categoryCondition = category ? Prisma.sql`AND c."slug" = ${category}` : Prisma.empty;
  const searchCondition = q ? Prisma.sql`AND (
    unaccent(lower(p."name")) LIKE '%' || unaccent(lower(${q})) || '%'
    OR unaccent(lower(p."brand")) LIKE '%' || unaccent(lower(${q})) || '%'
    OR unaccent(lower(p."sku")) LIKE '%' || unaccent(lower(${q})) || '%'
  )` : Prisma.empty;
  const [count, ids] = await Promise.all([
    prisma.$queryRaw<{ total: number }[]>(Prisma.sql`
      SELECT COUNT(*)::integer AS total
      FROM "Product" p
      INNER JOIN "Category" c ON c.id = p."categoryId"
      WHERE TRUE ${categoryCondition} ${searchCondition}
    `),
    prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
      SELECT p.id
      FROM "Product" p
      INNER JOIN "Category" c ON c.id = p."categoryId"
      WHERE TRUE ${categoryCondition} ${searchCondition}
      ORDER BY p."isBestseller" DESC, p.id ASC
      OFFSET ${(page - 1) * limit} LIMIT ${limit}
    `),
  ]);
  const records = ids.length ? await prisma.product.findMany({ where: { id: { in: ids.map(row => row.id) } }, include }) : [];
  const byId = new Map(records.map(product => [product.id, product]));
  const products = ids.map(row => byId.get(row.id)!).filter(Boolean);
  const total = count[0]?.total ?? 0;
  res.json({ items: products.map(publicProductSummary), total, page, limit });
});

catalogRouter.get('/products/:slug', async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug }, include });
  if (!product) {
    res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    return;
  }
  res.json(publicProductDetail(product));
});
