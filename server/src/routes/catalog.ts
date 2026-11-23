import { Router } from 'express';
import type { Prisma } from '@prisma/client';
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
  const where: Prisma.ProductWhereInput = {
    ...(category ? { category: { slug: category } } : {}),
    ...(q ? { OR: (['name', 'brand', 'sku'] as const).map(field => ({ [field]: { contains: q, mode: 'insensitive' } })) } : {}),
  };
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, include, orderBy: [{ isBestseller: 'desc' }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }),
  ]);
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
