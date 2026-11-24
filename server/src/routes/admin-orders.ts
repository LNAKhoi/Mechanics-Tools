import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAdmin, requirePermission } from '../auth/middleware.js';

export const adminOrdersRouter = Router();
adminOrdersRouter.use(requireAdmin);
const statuses = ['moi', 'da_lien_he', 'da_xac_nhan', 'dang_giao', 'hoan_thanh', 'da_huy'] as const;
const status = z.enum(statuses);
const update = z.object({ status: status.optional(), quotedTotal: z.number().int().min(0).max(2147483647).nullable().optional(), adminNote: z.string().trim().max(5000).nullable().optional() }).strict();
const include = { customer: true, items: true, statusEvents: { include: { adminUser: { select: { id: true, name: true, email: true } } }, orderBy: { at: 'asc' as const } } } satisfies Prisma.OrderInclude;
const transitions: Record<string, string[]> = { moi: ['da_lien_he', 'da_huy'], da_lien_he: ['da_xac_nhan', 'da_huy'], da_xac_nhan: ['dang_giao', 'da_huy'], dang_giao: ['hoan_thanh', 'da_huy'], hoan_thanh: [], da_huy: [] };
const detail = (order: any) => ({ ...order, history: order.statusEvents.map((event: any) => ({ from: event.from, to: event.to, at: event.at, admin: event.adminUser })) });
const number = (value: unknown, fallback: number, max: number) => typeof value === 'string' && /^\d+$/.test(value) ? Math.min(Number(value), max) || fallback : fallback;

adminOrdersRouter.get('/orders', requirePermission('orders:read'), async (req, res) => {
  const page = number(req.query.page, 1, 100000), limit = number(req.query.limit, 20, 100), q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '', parsedStatus = status.safeParse(req.query.status);
  if (req.query.status !== undefined && !parsedStatus.success) return void res.status(400).json({ error: 'Trạng thái không hợp lệ' });
  const where: Prisma.OrderWhereInput = { ...(parsedStatus.success ? { status: parsedStatus.data } : {}), ...(q ? { OR: [{ code: { contains: q, mode: 'insensitive' } }, { customer: { is: { phone: { contains: q }, name: { contains: q, mode: 'insensitive' } } } }] } : {}) };
  const [total, items, newCount] = await Promise.all([prisma.order.count({ where }), prisma.order.findMany({ where, include: { customer: true, items: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }), prisma.order.count({ where: { status: 'moi' } })]);
  res.json({ items, total, page, limit, newCount });
});
adminOrdersRouter.get('/orders/:id', requirePermission('orders:read'), async (req, res) => { const id = Number(req.params.id); if (!Number.isInteger(id)) return void res.status(404).json({ error: 'Không tìm thấy' }); const order = await prisma.order.findUnique({ where: { id }, include }); if (!order) return void res.status(404).json({ error: 'Không tìm thấy' }); res.json(detail(order)); });
adminOrdersRouter.put('/orders/:id', requirePermission('orders:write'), async (req, res) => {
  const id = Number(req.params.id), parsed = update.safeParse(req.body); if (!Number.isInteger(id)) return void res.status(404).json({ error: 'Không tìm thấy' }); if (!parsed.success) return void res.status(400).json({ error: 'Dữ liệu không hợp lệ', fieldErrors: parsed.error.flatten().fieldErrors });
  const current = await prisma.order.findUnique({ where: { id } }); if (!current) return void res.status(404).json({ error: 'Không tìm thấy' });
  if (parsed.data.status && parsed.data.status !== current.status && !transitions[current.status].includes(parsed.data.status)) return void res.status(400).json({ error: 'Không thể chuyển trạng thái này' });
  const order = await prisma.$transaction(async tx => tx.order.update({ where: { id }, data: { ...parsed.data, ...(parsed.data.status && parsed.data.status !== current.status ? { statusEvents: { create: { from: current.status, to: parsed.data.status, adminUserId: req.admin!.id } } } : {}) }, include }));
  res.json(detail(order));
});
adminOrdersRouter.get('/customers', requirePermission('customers:read'), async (req, res) => { const page = number(req.query.page, 1, 100000), limit = number(req.query.limit, 20, 100), q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : ''; const where: Prisma.CustomerWhereInput = q ? { OR: [{ phone: { contains: q } }, { name: { contains: q, mode: 'insensitive' } }] } : {}; const [total, rows] = await Promise.all([prisma.customer.count({ where }), prisma.customer.findMany({ where, include: { _count: { select: { orders: true } }, orders: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } } }, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * limit, take: limit })]); res.json({ items: rows.map(row => ({ id: row.id, name: row.name, phone: row.phone, orderCount: row._count.orders, lastOrderAt: row.orders[0]?.createdAt ?? null })), total, page, limit }); });
adminOrdersRouter.get('/customers/:id', requirePermission('customers:read'), async (req, res) => { const id = Number(req.params.id); const customer = Number.isInteger(id) ? await prisma.customer.findUnique({ where: { id }, include: { orders: { include: { items: true }, orderBy: { createdAt: 'desc' } } } }) : null; if (!customer) return void res.status(404).json({ error: 'Không tìm thấy' }); res.json(customer); });
