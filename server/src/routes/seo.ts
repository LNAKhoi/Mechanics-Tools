import { Router } from 'express';
import { prisma } from '../db.js';

export const seoRouter = Router();

const baseUrl = () => (process.env.SITE_URL ?? 'http://localhost:5173').replace(/\/+$/, '');
const absoluteUrl = (path: string) => new URL(path, `${baseUrl()}/`).toString();
const xmlEscape = (value: string) => value.replace(/[<>&'\"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]!);

seoRouter.get('/sitemap.xml', async (_req, res) => {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ select: { slug: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
    prisma.product.findMany({ select: { slug: true }, orderBy: [{ isBestseller: 'desc' }, { id: 'asc' }] }),
  ]);
  const paths = ['/', '/danh-muc', ...categories.map(category => `/danh-muc/${category.slug}`), ...products.map(product => `/san-pham/${product.slug}`), '/gioi-thieu', '/lien-he'];
  const urls = paths.map(path => `  <url><loc>${xmlEscape(absoluteUrl(path))}</loc></url>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

seoRouter.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /quan-tri\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`);
});
