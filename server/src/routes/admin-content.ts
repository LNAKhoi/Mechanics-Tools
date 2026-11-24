import { Router, type Response } from 'express';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAdmin, requirePermission } from '../auth/middleware.js';

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalUrl = z.union([z.string().trim().url().max(500), z.literal('')]).optional().nullable().transform(value => value || null);
const optionalLinkUrl = z.union([z.string().trim().url().max(500), z.string().trim().regex(/^\/(?!\/)/).max(500), z.literal('')]).optional().nullable().transform(value => value || null);
const image = z.string().trim().max(500).refine(value => /^\/(assets|uploads)\//.test(value) || /^https?:\/\//i.test(value), 'Ảnh không hợp lệ');
const html = z.string().max(50000).transform(value => sanitizeHtml(value, { allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'a', 'img', 'blockquote'], allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt'] }, allowedSchemes: ['http', 'https'], transformTags: { a: (tagName, attribs) => ({ tagName, attribs: attribs.target ? { ...attribs, rel: 'noopener noreferrer' } : attribs }) }, disallowedTagsMode: 'discard' }));
const banner = z.object({ title: text(200), imageUrl: image, linkUrl: optionalLinkUrl, placement: z.enum(['hero', 'business']), sortOrder: z.number().int(), isEnabled: z.boolean() }).strict();
const page = z.object({ title: text(200), html }).strict();
const googleMapsHosts = new Set(['www.google.com', 'google.com', 'maps.google.com', 'maps.app.goo.gl', 'goo.gl']);
const googleMapsUrl = z.string().trim().url().refine(value => { const url = new URL(value); return url.protocol === 'https:' && googleMapsHosts.has(url.hostname.toLowerCase()); }, 'Bản đồ phải là URL Google Maps https');
const site = z.object({ address: text(500), hotlines: z.array(z.object({ label: text(100), numbers: z.array(text(50)).min(1) })).max(20), email: z.string().trim().email().max(200), zaloUrl: optionalUrl.refine(value => !value || /^https:\/\/zalo\.me\//.test(value), 'Zalo phải là https://zalo.me/...'), messengerUrl: optionalUrl.refine(value => !value || /^https:\/\/m\.me\//.test(value), 'Messenger phải là https://m.me/...'), mapEmbedUrl: googleMapsUrl, stores: z.array(z.object({ name: text(200), address: text(500) })).max(30) }).strict();
const popup = z.object({ title: text(200), html, imageUrl: image.optional().nullable(), linkUrl: optionalLinkUrl, isEnabled: z.boolean(), startsAt: z.string().datetime().optional().nullable(), endsAt: z.string().datetime().optional().nullable() }).strict().refine(value => !value.startsAt || !value.endsAt || new Date(value.startsAt) <= new Date(value.endsAt), { message: 'Khoảng thời gian không hợp lệ', path: ['endsAt'] });
const invalid = (res: Response, error: z.ZodError) => res.status(400).json({ error: 'Dữ liệu không hợp lệ', fieldErrors: error.flatten().fieldErrors });

export const adminContentRouter = Router();
// This router is mounted at /api/admin alongside other admin routers. Scope the
// guard to content routes so it does not reject requests intended for routers
// mounted after this one.
adminContentRouter.use('/content', requireAdmin, requirePermission('content:write'));
adminContentRouter.get('/content/banners', async (_req, res) => res.json({ items: await prisma.banner.findMany({ orderBy: [{ placement: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }] }) }));
adminContentRouter.post('/content/banners', async (req, res) => { const parsed = banner.safeParse(req.body); if (!parsed.success) return invalid(res, parsed.error); res.status(201).json(await prisma.banner.create({ data: parsed.data })); });
adminContentRouter.put('/content/banners/:id', async (req, res) => { const id = z.coerce.number().int().positive().safeParse(req.params.id); const parsed = banner.partial().safeParse(req.body); if (!id.success) return void res.status(404).json({ error: 'Không tìm thấy' }); if (!parsed.success) return invalid(res, parsed.error); try { res.json(await prisma.banner.update({ where: { id: id.data }, data: parsed.data })); } catch { res.status(404).json({ error: 'Không tìm thấy' }); } });
adminContentRouter.delete('/content/banners/:id', async (req, res) => { const id = z.coerce.number().int().positive().safeParse(req.params.id); if (!id.success) return void res.status(404).json({ error: 'Không tìm thấy' }); try { await prisma.banner.delete({ where: { id: id.data } }); res.status(204).end(); } catch { res.status(404).json({ error: 'Không tìm thấy' }); } });
adminContentRouter.get('/content/pages/:slug', async (req, res) => { const row = await prisma.page.findUnique({ where: { slug: req.params.slug } }); if (!row) return void res.status(404).json({ error: 'Không tìm thấy' }); res.json(row); });
adminContentRouter.put('/content/pages/:slug', async (req, res) => { if (!['gioi-thieu', 'lien-he'].includes(req.params.slug)) return void res.status(404).json({ error: 'Không tìm thấy' }); const parsed = page.safeParse(req.body); if (!parsed.success) return invalid(res, parsed.error); res.json(await prisma.page.upsert({ where: { slug: req.params.slug }, update: parsed.data, create: { slug: req.params.slug, ...parsed.data } })); });
adminContentRouter.get('/content/site', async (_req, res) => res.json(await prisma.siteSettings.findUnique({ where: { id: 1 } })));
adminContentRouter.put('/content/site', async (req, res) => { const parsed = site.safeParse(req.body); if (!parsed.success) return invalid(res, parsed.error); res.json(await prisma.siteSettings.upsert({ where: { id: 1 }, update: parsed.data, create: { id: 1, ...parsed.data } })); });
adminContentRouter.get('/content/popup', async (_req, res) => res.json(await prisma.popup.findUnique({ where: { id: 1 } })));
adminContentRouter.put('/content/popup', async (req, res) => { const parsed = popup.safeParse(req.body); if (!parsed.success) return invalid(res, parsed.error); const data = { ...parsed.data, startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null, endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null }; res.json(await prisma.popup.upsert({ where: { id: 1 }, update: { ...data, version: { increment: 1 } }, create: { id: 1, ...data, version: 1 } })); });
