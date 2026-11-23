import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { containsPriceKey, prisma, resetDatabase } from './helpers.js';

const app = createApp();

beforeAll(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('GET /api/categories', () => {
  it('lists the 6 seeded categories in order, with product counts and no price', async () => {
    const res = await request(app).get('/api/categories').expect(200);
    expect(res.body.items).toHaveLength(6);
    expect(res.body.items[0]).toEqual({ slug: 'may-khoan', name: 'Máy khoan & bắt vít', sortOrder: 1, productCount: 2 });
    expect(containsPriceKey(res.body)).toBe(false);
  });
});

describe('GET /api/products', () => {
  it('lists all 4 seeded products with summary fields and no price', async () => {
    const res = await request(app).get('/api/products').expect(200);
    expect(res.body.total).toBe(4);
    expect(res.body.items).toHaveLength(4);
    for (const item of res.body.items) {
      expect(Object.keys(item).sort()).toEqual(['badges', 'brand', 'category', 'image', 'name', 'slug']);
      expect(item).not.toHaveProperty('price');
    }
    expect(containsPriceKey(res.body)).toBe(false);
  });

  it('filters by category and case-insensitive query (matrix: ?category=may-khoan&q=makita)', async () => {
    const res = await request(app).get('/api/products').query({ category: 'may-khoan', q: 'makita' }).expect(200);
    expect(res.body.items.map((item: { slug: string }) => item.slug)).toEqual(['may-khoan-van-vit-dung-pin-18v-makita']);
    expect(res.body.items[0]).toMatchObject({ brand: 'Makita', badges: ['Bán chạy'], category: { slug: 'may-khoan' }, image: '/assets/home/3c819.png' });
    expect(containsPriceKey(res.body)).toBe(false);
  });

  it('matches q against name, brand and sku', async () => {
    const byName = await request(app).get('/api/products').query({ q: 'MÁY MÀI' }).expect(200);
    expect(byName.body.items.map((item: { slug: string }) => item.slug)).toEqual(['may-mai-goc-bosch-100-mm']);
    const byBrand = await request(app).get('/api/products').query({ q: 'bosch' }).expect(200);
    expect(byBrand.body.total).toBe(2);
    const bySku = await request(app).get('/api/products').query({ q: 'dtd171' }).expect(200);
    expect(bySku.body.items.map((item: { slug: string }) => item.slug)).toEqual(['may-khoan-van-vit-dung-pin-18v-makita']);
  });

  it('returns an empty list for an unknown category', async () => {
    const res = await request(app).get('/api/products').query({ category: 'khong-ton-tai' }).expect(200);
    expect(res.body).toMatchObject({ items: [], total: 0 });
  });

  it('paginates with page and limit', async () => {
    const first = await request(app).get('/api/products').query({ page: 1, limit: 3 }).expect(200);
    const second = await request(app).get('/api/products').query({ page: 2, limit: 3 }).expect(200);
    expect(first.body).toMatchObject({ total: 4, page: 1, limit: 3 });
    expect(first.body.items).toHaveLength(3);
    expect(second.body.items).toHaveLength(1);
    // Bestsellers first, then by id; pages do not overlap and together cover all 4.
    const slugs = [...first.body.items, ...second.body.items].map((item: { slug: string }) => item.slug);
    expect(slugs).toEqual([
      'may-khoan-van-vit-dung-pin-18v-makita',
      'mui-khoan-carbide-ngan-6-3-mm',
      'may-siet-bu-long-dung-pin-milwaukee-m18',
      'may-mai-goc-bosch-100-mm',
    ]);
  });
});

describe('GET /api/products/:slug', () => {
  it('returns the product with images, specs and stock but no price', async () => {
    const res = await request(app).get('/api/products/may-khoan-van-vit-dung-pin-18v-makita').expect(200);
    expect(res.body).toMatchObject({
      slug: 'may-khoan-van-vit-dung-pin-18v-makita',
      name: 'Máy khoan và vặn vít dùng pin 18V Makita',
      sku: 'DTD171Z',
      stock: 25,
      images: ['/assets/home/3c819.png', '/assets/product/3c819.png'],
    });
    expect(res.body.specs[0]).toEqual({ label: 'Động cơ', value: 'Không chổi than (BL)' });
    expect(res.body).not.toHaveProperty('price');
    expect(containsPriceKey(res.body)).toBe(false);
  });

  it('returns a JSON 404 for an unknown slug', async () => {
    const res = await request(app).get('/api/products/khong-ton-tai').expect(404).expect('Content-Type', /json/);
    expect(res.body).toEqual({ error: 'Không tìm thấy sản phẩm' });
  });
});
