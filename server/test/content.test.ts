import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/auth/password.js';
import { prisma, resetDatabase } from './helpers.js';
import { seedContentInto } from '../prisma/seed-data.js';

const password = 'test-password-123';
let app: ReturnType<typeof createApp>;

async function login(email: string) {
  const response = await request(app).post('/api/admin/auth/login').send({ email, password }).expect(200);
  if (email === 'editor@example.com') expect(response.body.permissions).toContain('content:write');
  return (response.headers['set-cookie'] as string[]).map(value => value.split(';')[0]);
}

async function addBanner(cookie: string[], values: Partial<{ title: string; imageUrl: string; linkUrl: string | null; placement: 'hero' | 'business'; sortOrder: number; isEnabled: boolean }> = {}) {
  return request(app).post('/api/admin/content/banners').set('Cookie', cookie).send({
    title: 'Banner', imageUrl: '/assets/home/763d1.png', linkUrl: null, placement: 'hero', sortOrder: 0, isEnabled: true, ...values,
  }).expect(201);
}

beforeEach(async () => {
  await resetDatabase();
  app = createApp();
  const editor = await prisma.role.findUniqueOrThrow({ where: { name: 'content_editor' } });
  const manager = await prisma.role.findUniqueOrThrow({ where: { name: 'product_manager' } });
  await prisma.adminUser.createMany({ data: [
    { email: 'editor@example.com', name: 'Editor', passwordHash: await hashPassword(password), roleId: editor.id },
    { email: 'manager@example.com', name: 'Manager', passwordHash: await hashPassword(password), roleId: manager.id },
  ] });
});
afterAll(() => prisma.$disconnect());

describe('content management', () => {
  it('returns only enabled banners in display order and can return no banners for the storefront fallback', async () => {
    const cookie = await login('editor@example.com');
    await prisma.banner.deleteMany();
    await addBanner(cookie, { title: 'Second hero', sortOrder: 2, linkUrl: '/danh-muc' });
    await addBanner(cookie, { title: 'First hero', sortOrder: 1 });
    await addBanner(cookie, { title: 'Hidden', sortOrder: 0, isEnabled: false });
    const visible = (await request(app).get('/api/content/banners').expect(200)).body.items;
    expect(visible.map((item: { title: string }) => item.title)).toEqual(['First hero', 'Second hero']);
    expect(visible[1].linkUrl).toBe('/danh-muc');
    await prisma.banner.updateMany({ data: { isEnabled: false } });
    expect((await request(app).get('/api/content/banners').expect(200)).body.items).toEqual([]);
  });

  it('sanitizes saved page HTML and rejects an empty page title', async () => {
    const cookie = await login('editor@example.com');
    const saved = await request(app).put('/api/admin/content/pages/gioi-thieu').set('Cookie', cookie).send({
      title: 'Giới thiệu mới', html: '<p onclick="bad()">An toàn</p><script>alert(1)</script><img src="https://safe.example/a.png" onerror="bad()"><a href="https://example.com" target="_blank">Link</a>',
    }).expect(200);
    expect(saved.body.html).toContain('An toàn');
    expect(saved.body.html).not.toMatch(/script|onerror|onclick/i);
    expect(saved.body.html).toContain('rel="noopener noreferrer"');
    expect((await request(app).get('/api/content/pages/gioi-thieu').expect(200)).body.html).toBe(saved.body.html);
    await request(app).put('/api/admin/content/pages/gioi-thieu').set('Cookie', cookie).send({ title: '', html: '<p>x</p>' }).expect(400);
  });

  it('publishes contact settings, keeps chat URLs optional, and rejects invalid map or chat links', async () => {
    const cookie = await login('editor@example.com');
    const body = { address: '1 Đường Test', hotlines: [{ label: 'Hotline', numbers: ['0900'] }], email: 'hello@example.com', zaloUrl: 'https://zalo.me/shop', messengerUrl: 'https://m.me/shop', mapEmbedUrl: 'https://www.google.com/maps/place/test', stores: [{ name: 'Cửa hàng', address: '1 Đường Test' }] };
    await request(app).put('/api/admin/content/site').set('Cookie', cookie).send(body).expect(200);
    expect((await request(app).get('/api/content/site').expect(200)).body).toMatchObject({ address: body.address, zaloUrl: body.zaloUrl, messengerUrl: body.messengerUrl });
    const withoutChat = await request(app).put('/api/admin/content/site').set('Cookie', cookie).send({ ...body, zaloUrl: '', messengerUrl: '' }).expect(200);
    expect(withoutChat.body.zaloUrl).toBeNull();
    expect(withoutChat.body.messengerUrl).toBeNull();
    await request(app).put('/api/admin/content/site').set('Cookie', cookie).send({ ...body, mapEmbedUrl: 'https://example.com/map' }).expect(400);
    await request(app).put('/api/admin/content/site').set('Cookie', cookie).send({ ...body, mapEmbedUrl: 'https://google.com.evil.com/maps' }).expect(400);
    await request(app).put('/api/admin/content/site').set('Cookie', cookie).send({ ...body, mapEmbedUrl: 'https://evilgoogle.com/maps' }).expect(400);
    await request(app).put('/api/admin/content/site').set('Cookie', cookie).send({ ...body, zaloUrl: 'https://example.com/zalo' }).expect(400);
    await request(app).put('/api/admin/content/site').set('Cookie', cookie).send({ ...body, messengerUrl: 'https://facebook.com/messages' }).expect(400);
  });

  it('does not restore default banners after an editor reorders them and content is reseeded', async () => {
    const original = await prisma.banner.findFirstOrThrow({ where: { placement: 'hero' } });
    await prisma.banner.update({ where: { id: original.id }, data: { title: 'Editor order', sortOrder: 99 } });
    await seedContentInto(prisma);
    expect(await prisma.banner.findMany()).toHaveLength(2);
    expect(await prisma.banner.findUniqueOrThrow({ where: { id: original.id } })).toMatchObject({ title: 'Editor order', sortOrder: 99 });
  });

  it('only publishes enabled popups inside their schedule and increments their version on every save', async () => {
    const cookie = await login('editor@example.com');
    const data = { title: 'Khuyến mãi', html: '<p>Ưu đãi</p>', imageUrl: null, linkUrl: null, isEnabled: true, startsAt: new Date(Date.now() - 1_000).toISOString(), endsAt: new Date(Date.now() + 60_000).toISOString() };
    const first = await request(app).put('/api/admin/content/popup').set('Cookie', cookie).send(data).expect(200);
    expect((await request(app).get('/api/content/popup').expect(200)).body.version).toBe(first.body.version);
    const future = await request(app).put('/api/admin/content/popup').set('Cookie', cookie).send({ ...data, startsAt: new Date(Date.now() + 60_000).toISOString(), endsAt: null }).expect(200);
    expect(future.body.version).toBeGreaterThan(first.body.version);
    expect((await request(app).get('/api/content/popup').expect(200)).body).toBeNull();
    await request(app).put('/api/admin/content/popup').set('Cookie', cookie).send({ ...data, isEnabled: false }).expect(200);
    expect((await request(app).get('/api/content/popup').expect(200)).body).toBeNull();
  });

  it('returns 403 in both directions when content and product roles cross boundaries', async () => {
    const editor = await login('editor@example.com');
    const manager = await login('manager@example.com');
    await request(app).post('/api/admin/products').set('Cookie', editor).send({}).expect(403);
    await request(app).put('/api/admin/content/popup').set('Cookie', manager).send({}).expect(403);
  });
});
