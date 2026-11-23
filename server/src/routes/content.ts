import { Router } from 'express';
import { prisma } from '../db.js';

export const contentRouter = Router();
contentRouter.get('/content/banners', async (_req, res) => {
  const items = await prisma.banner.findMany({ where: { isEnabled: true }, orderBy: [{ placement: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }] });
  res.json({ items });
});
contentRouter.get('/content/pages/:slug', async (req, res) => {
  if (!['gioi-thieu', 'lien-he'].includes(req.params.slug)) return void res.status(404).json({ error: 'Không tìm thấy' });
  const page = await prisma.page.findUnique({ where: { slug: req.params.slug } });
  if (!page) return void res.status(404).json({ error: 'Không tìm thấy' });
  res.json(page);
});
contentRouter.get('/content/site', async (_req, res) => {
  const site = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!site) return void res.status(404).json({ error: 'Không tìm thấy' });
  res.json(site);
});
contentRouter.get('/content/popup', async (_req, res) => {
  const popup = await prisma.popup.findUnique({ where: { id: 1 } });
  const now = new Date();
  if (!popup || !popup.isEnabled || (popup.startsAt && popup.startsAt > now) || (popup.endsAt && popup.endsAt < now)) return void res.json(null);
  res.json(popup);
});
