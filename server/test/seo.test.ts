import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma, resetDatabase } from './helpers.js';

const app = createApp();

beforeAll(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('SEO discovery routes', () => {
  it('serves a valid sitemap with every public seeded category and product URL', async () => {
    const res = await request(app).get('/sitemap.xml').expect(200).expect('Content-Type', /xml/);
    expect(res.text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(res.text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    for (const path of ['/', '/danh-muc', '/danh-muc/may-khoan', '/danh-muc/may-mai-may-cat', '/san-pham/may-mai-goc-bosch-100-mm', '/gioi-thieu', '/lien-he']) {
      expect(res.text).toContain(`http://localhost:5173${path}`);
    }
    expect(res.text).not.toContain('/quan-tri');
    expect(res.text).not.toMatch(/price|5270000/i);
  });

  it('allows public crawlers, blocks admin routes, and points robots at the sitemap', async () => {
    const res = await request(app).get('/robots.txt').expect(200).expect('Content-Type', /text\/plain/);
    expect(res.text).toContain('User-agent: *');
    expect(res.text).toContain('Allow: /');
    expect(res.text).toContain('Disallow: /quan-tri');
    expect(res.text).toContain('Sitemap: http://localhost:5173/sitemap.xml');
  });
});
