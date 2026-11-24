import { Router, type Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAdmin, requirePermission } from '../auth/middleware.js';
import { adminCategory, adminProduct } from '../serializers.js';

const slug = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang');
const text = (max: number) => z.string().trim().min(1).max(max);
/** Postgres INT4 range; larger values would otherwise surface as 500s. */
const INT4_MAX = 2147483647;
const int = () => z.number().int().max(INT4_MAX);
/** Site-relative asset/upload paths or absolute http(s) URLs only (no data:, javascript:, etc.). */
const imageUrl = text(500).refine(url => /^\/(assets|uploads)\//.test(url) || /^https?:\/\/[^\s/]+/i.test(url), 'Ảnh phải là đường dẫn /assets/, /uploads/ hoặc URL http(s)');
const specs = z.array(z.object({ label: text(100), value: text(200) })).max(50);
const images = z.array(imageUrl).max(20);

const productBody = z.object({
  slug,
  name: text(200),
  brand: text(100),
  sku: text(100),
  description: z.string().max(20000).default(''),
  price: int().min(0),
  stock: int().min(0).default(0),
  isBestseller: z.boolean().default(false),
  specs: specs.default([]),
  categorySlug: slug,
  images: images.default([]),
}).strict();

// For updates nothing is defaulted: omitted fields stay as they are.
const productPatch = productBody.extend({
  description: z.string().max(20000),
  stock: int().min(0),
  isBestseller: z.boolean(),
  specs,
  images,
}).partial().strict();

const categoryBody = z.object({ slug, name: text(100), sortOrder: int().min(-INT4_MAX).default(0) }).strict();
const categoryPatch = z.object({ slug, name: text(100), sortOrder: int().min(-INT4_MAX) }).partial().strict();

const idParam = z.coerce.number().int().positive().max(INT4_MAX);
const include = { category: true, images: true } satisfies Prisma.ProductInclude;
const NOT_FOUND = { error: 'Không tìm thấy' };

const invalid = (res: Response, fieldErrors: Record<string, string[] | undefined>) => {
  res.status(400).json({ error: 'Dữ liệu không hợp lệ', fieldErrors });
};

/** Maps Prisma unique-constraint and not-found errors to 409/404; rethrows anything else. */
function handlePrismaError(res: Response, error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      const fields = Array.isArray(target) ? target.map(String) : [String(target ?? 'slug')];
      res.status(409).json({ error: 'Giá trị đã tồn tại', fieldErrors: Object.fromEntries(fields.map(field => [field, ['Giá trị đã tồn tại']])) });
      return;
    }
    if (error.code === 'P2025') {
      res.status(404).json(NOT_FOUND);
      return;
    }
  }
  throw error;
}

/** undefined = not requested, null = unknown slug. */
async function categoryIdFor(categorySlug: string | undefined) {
  if (categorySlug === undefined) return undefined;
  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  return category ? category.id : null;
}

export const adminCatalogRouter = Router();

// Every route below requires a valid admin session (401) and then a permission (403).
adminCatalogRouter.use(requireAdmin);

adminCatalogRouter.get('/products', requirePermission('products:write'), async (req, res) => {
  const positiveInt = (value: unknown, fallback: number, max: number) => {
    const number = typeof value === 'string' ? Number(value) : NaN;
    return Number.isFinite(number) && Number.isInteger(number) && number > 0 ? Math.min(max, number) : fallback;
  };
  const page = positiveInt(req.query.page, 1, 100000);
  const limit = positiveInt(req.query.limit, 20, 100);
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const stock = typeof req.query.stock === 'string' ? req.query.stock : '';
  const where: Prisma.ProductWhereInput = {
    ...(q ? { OR: (['name', 'brand', 'sku'] as const).map(field => ({ [field]: { contains: q, mode: 'insensitive' } })) } : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(stock === 'in' ? { stock: { gt: 0 } } : stock === 'out' ? { stock: 0 } : {}),
  };
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, include, orderBy: { id: 'asc' }, skip: (page - 1) * limit, take: limit }),
  ]);
  res.json({ items: products.map(adminProduct), total, page, limit });
});

adminCatalogRouter.get('/products/:id', requirePermission('products:write'), async (req, res) => {
  const id = idParam.safeParse(req.params.id);
  if (!id.success) return void res.status(404).json({ error: 'Not found' });
  const product = await prisma.product.findUnique({ where: { id: id.data }, include });
  if (!product) return void res.status(404).json({ error: 'Not found' });
  res.json(adminProduct(product));
});

adminCatalogRouter.get('/categories', requirePermission('categories:write'), async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
  res.json({ items: categories.map(adminCategory) });
});

adminCatalogRouter.post('/products', requirePermission('products:write'), async (req, res) => {
  const parsed = productBody.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error.flatten().fieldErrors);
  const { categorySlug, images: imageUrls, ...data } = parsed.data;
  const categoryId = await categoryIdFor(categorySlug);
  if (!categoryId) return invalid(res, { categorySlug: ['Danh mục không tồn tại'] });
  try {
    const product = await prisma.product.create({
      data: { ...data, categoryId, images: { create: imageUrls.map((url, sortOrder) => ({ url, sortOrder })) } },
      include,
    });
    res.status(201).json(adminProduct(product));
  } catch (error) {
    handlePrismaError(res, error);
  }
});

adminCatalogRouter.put('/products/:id', requirePermission('products:write'), async (req, res) => {
  const id = idParam.safeParse(req.params.id);
  if (!id.success) return void res.status(404).json(NOT_FOUND);
  const parsed = productPatch.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error.flatten().fieldErrors);
  const { categorySlug, images: imageUrls, ...data } = parsed.data;
  const categoryId = await categoryIdFor(categorySlug);
  if (categoryId === null) return invalid(res, { categorySlug: ['Danh mục không tồn tại'] });
  try {
    const product = await prisma.$transaction(async tx => {
      if (imageUrls) await tx.productImage.deleteMany({ where: { productId: id.data } });
      return tx.product.update({
        where: { id: id.data },
        data: {
          ...data,
          ...(categoryId ? { categoryId } : {}),
          ...(imageUrls ? { images: { create: imageUrls.map((url, sortOrder) => ({ url, sortOrder })) } } : {}),
        },
        include,
      });
    });
    res.json(adminProduct(product));
  } catch (error) {
    handlePrismaError(res, error);
  }
});

adminCatalogRouter.delete('/products/:id', requirePermission('products:write'), async (req, res) => {
  const id = idParam.safeParse(req.params.id);
  if (!id.success) return void res.status(404).json(NOT_FOUND);
  try {
    await prisma.product.delete({ where: { id: id.data } });
    res.status(204).end();
  } catch (error) {
    handlePrismaError(res, error);
  }
});

adminCatalogRouter.post('/categories', requirePermission('categories:write'), async (req, res) => {
  const parsed = categoryBody.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error.flatten().fieldErrors);
  try {
    const category = await prisma.category.create({ data: parsed.data });
    res.status(201).json(adminCategory(category));
  } catch (error) {
    handlePrismaError(res, error);
  }
});

adminCatalogRouter.put('/categories/:id', requirePermission('categories:write'), async (req, res) => {
  const id = idParam.safeParse(req.params.id);
  if (!id.success) return void res.status(404).json(NOT_FOUND);
  const parsed = categoryPatch.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error.flatten().fieldErrors);
  try {
    const category = await prisma.category.update({ where: { id: id.data }, data: parsed.data });
    res.json(adminCategory(category));
  } catch (error) {
    handlePrismaError(res, error);
  }
});

adminCatalogRouter.delete('/categories/:id', requirePermission('categories:write'), async (req, res) => {
  const id = idParam.safeParse(req.params.id);
  if (!id.success) return void res.status(404).json(NOT_FOUND);
  const category = await prisma.category.findUnique({ where: { id: id.data }, include: { _count: { select: { products: true } } } });
  if (!category) return void res.status(404).json(NOT_FOUND);
  if (category._count.products > 0) {
    return void res.status(409).json({ error: `Danh mục còn ${category._count.products} sản phẩm, không thể xóa` });
  }
  try {
    await prisma.category.delete({ where: { id: id.data } });
    res.status(204).end();
  } catch (error) {
    // A product added between the count and the delete hits the FK restriction.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return void res.status(409).json({ error: 'Danh mục còn sản phẩm, không thể xóa' });
    }
    handlePrismaError(res, error);
  }
});
