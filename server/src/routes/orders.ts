import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../db.js';

export function createOrdersRouter() {
const ordersRouter = Router();
const phone = z.string().trim().transform(value => value.replace(/^\+84/, '0').replace(/[.\s-]/g, '')).refine(value => /^0(3|5|7|8|9)\d{8}$/.test(value), 'Số điện thoại không hợp lệ');
const text = (max: number) => z.string().trim().min(1).max(max);
const orderBody = z.object({
  name: text(200), phone, email: z.string().trim().email().max(254).optional().or(z.literal('')),
  province: text(100), ward: text(100), address: text(500), note: z.string().trim().max(2000).optional(),
  deliveryOption: z.enum(['standard', 'express']), honeypot: z.string().max(200).optional().default(''),
  items: z.array(z.object({ productId: z.union([z.number().int().positive(), z.string().trim().min(1).max(150)]), quantity: z.number().int().min(1).max(99) })).min(1).max(50),
}).strict();
const lookupBody = z.object({ code: z.string().trim().regex(/^LT-\d{6}$/), phone }).strict();
const invalid = (res: any, error: z.ZodError) => res.status(400).json({ error: 'Dữ liệu không hợp lệ', fieldErrors: error.flatten().fieldErrors });
const publicOrder = (order: any) => ({ code: order.code, status: order.status, deliveryOption: order.deliveryOption, createdAt: order.createdAt, items: order.items.map((item: any) => ({ productId: item.productId, slug: item.slug, name: item.name, sku: item.sku, image: item.image, quantity: item.quantity })), history: order.statusEvents.map((event: any) => ({ from: event.from, to: event.to, at: event.at })) });

ordersRouter.post('/orders', rateLimit({ windowMs: 15 * 60_000, limit: 5, standardHeaders: true, legacyHeaders: false, message: { error: 'Vui lòng thử lại sau' } }), async (req, res) => {
  const parsed = orderBody.safeParse(req.body); if (!parsed.success) return invalid(res, parsed.error);
  const data = parsed.data;
  if (data.honeypot) return void res.status(400).json({ error: 'Yêu cầu không hợp lệ' });
  const duplicates = new Set<string>();
  for (const item of data.items) { const key = String(item.productId); if (duplicates.has(key)) return void res.status(400).json({ error: 'Sản phẩm bị trùng' }); duplicates.add(key); }
  try {
    const order = await prisma.$transaction(async tx => {
      const numericIds = data.items.filter(item => typeof item.productId === 'number').map(item => item.productId as number);
      const slugs = data.items.filter(item => typeof item.productId === 'string').map(item => item.productId as string);
      const products = await tx.product.findMany({ where: { OR: [{ id: { in: numericIds } }, { slug: { in: slugs } }] }, include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } });
      const byRef = new Map(products.flatMap(product => [[String(product.id), product], [product.slug, product]]));
      const lines = data.items.map(item => ({ item, product: byRef.get(String(item.productId)) }));
      const bad = lines.find(line => !line.product || line.product.stock < 1);
      if (bad) throw new Error(`PRODUCT:${bad.product?.name ?? String(bad.item.productId)}`);
      const customer = await tx.customer.upsert({ where: { phone: data.phone }, update: { name: data.name, email: data.email || null }, create: { phone: data.phone, name: data.name, email: data.email || null } });
      // A transaction serializes code allocation; the unique index is the final guard.
      await tx.$executeRawUnsafe('LOCK TABLE "Order" IN EXCLUSIVE MODE');
      const last = await tx.order.findFirst({ orderBy: { id: 'desc' }, select: { code: true } });
      const sequence = last ? Number(last.code.slice(3)) + 1 : 1;
      if (sequence > 999999) throw new Error('ORDER_CODES_EXHAUSTED');
      const created = await tx.order.create({ data: { code: `LT-${String(sequence).padStart(6, '0')}`, customerId: customer.id, province: data.province, ward: data.ward, address: data.address, deliveryOption: data.deliveryOption, note: data.note || null, items: { create: lines.map(({ item, product }) => ({ productId: product!.id, slug: product!.slug, name: product!.name, sku: product!.sku, image: product!.images[0]?.url ?? null, quantity: item.quantity })) }, statusEvents: { create: { to: 'moi' } } }, include: { items: true, statusEvents: { orderBy: { at: 'asc' } } } });
      return created;
    });
    res.status(201).json({ code: order.code });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('PRODUCT:')) return void res.status(400).json({ error: `Sản phẩm không có sẵn: ${error.message.slice(8)}` });
    throw error;
  }
});

ordersRouter.post('/orders/lookup', rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Vui lòng thử lại sau' } }), async (req, res) => {
  const parsed = lookupBody.safeParse(req.body); if (!parsed.success) return invalid(res, parsed.error);
  const order = await prisma.order.findFirst({ where: { code: parsed.data.code, customer: { phone: parsed.data.phone } }, include: { items: true, statusEvents: { orderBy: { at: 'asc' } } } });
  if (!order) return void res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
  res.json(publicOrder(order));
});
return ordersRouter;
}
