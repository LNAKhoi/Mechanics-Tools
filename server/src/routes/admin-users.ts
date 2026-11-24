import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin, requirePermission } from '../auth/middleware.js';
import { prisma } from '../db.js';

const idParam = z.coerce.number().int().positive();
export const adminUsersRouter = Router();
// Only protect this router's own paths; it shares the /api/admin mount point
// with the catalog, content, upload, and orders routers.
adminUsersRouter.use('/roles', requireAdmin, requirePermission('*'));
adminUsersRouter.use('/users', requireAdmin, requirePermission('*'));

adminUsersRouter.get('/roles', async (_req, res) => {
  const roles = await prisma.role.findMany({ orderBy: { id: 'asc' } });
  res.json({ items: roles.map(role => ({ id: role.id, name: role.name, permissions: role.permissions })) });
});
adminUsersRouter.get('/users', async (_req, res) => {
  const users = await prisma.adminUser.findMany({ include: { role: true }, orderBy: { id: 'asc' } });
  res.json({ items: users.map(user => ({ id: user.id, email: user.email, name: user.name, isActive: user.isActive, role: user.role.name, createdAt: user.createdAt })) });
});
adminUsersRouter.post('/users/:id/deactivate', async (req, res) => {
  const parsed = idParam.safeParse(req.params.id);
  if (!parsed.success) return void res.status(404).json({ error: 'Không tìm thấy' });
  if (parsed.data === req.admin!.id) return void res.status(409).json({ error: 'Không thể vô hiệu hóa chính mình' });
  try {
    await prisma.$transaction(async tx => {
      // Serialize deactivations so two requests cannot both observe two active super-admins.
      await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(918274)');
      const target = await tx.adminUser.findUnique({ where: { id: parsed.data }, include: { role: true } });
      if (!target) throw new Error('NOT_FOUND');
      if (!target.isActive) throw new Error('INACTIVE');
      if (target.role.name === 'super_admin' && await tx.adminUser.count({ where: { isActive: true, role: { name: 'super_admin' } } }) <= 1) throw new Error('LAST_SUPER');
      await tx.adminUser.update({ where: { id: target.id }, data: { isActive: false } });
      await tx.session.deleteMany({ where: { adminUserId: target.id } });
    });
    res.status(204).end();
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'NOT_FOUND') return void res.status(404).json({ error: 'Không tìm thấy' });
    if (message === 'INACTIVE') return void res.status(409).json({ error: 'Quản trị viên đã bị vô hiệu hóa' });
    if (message === 'LAST_SUPER') return void res.status(409).json({ error: 'Không thể vô hiệu hóa quản trị viên cấp cao cuối cùng' });
    throw error;
  }
});
