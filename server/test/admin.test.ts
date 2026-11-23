import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/auth/password.js';
import { SESSION_COOKIE, sessionCookieOptions } from '../src/auth/session.js';
import { seedCatalogInto } from '../prisma/seed-data.js';
import { containsPriceKey, prisma, resetDatabase } from './helpers.js';

const PASSWORD = 'test-password-123';
let app: ReturnType<typeof createApp>;

async function createAdmin(email: string, roleName: string, permissions?: string[]) {
  const role = permissions
    ? await prisma.role.upsert({ where: { name: roleName }, update: { permissions }, create: { name: roleName, permissions } })
    : await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  return prisma.adminUser.create({ data: { email, name: email, passwordHash: await hashPassword(PASSWORD), roleId: role.id } });
}

async function loginCookie(email: string) {
  const res = await request(app).post('/api/admin/auth/login').send({ email, password: PASSWORD }).expect(200);
  return (res.headers['set-cookie'] as unknown as string[]).map(cookie => cookie.split(';')[0]);
}

const validProduct = {
  slug: 'may-cua-dia-makita-185mm',
  name: 'Máy cưa đĩa Makita 185mm',
  brand: 'Makita',
  sku: 'HS7010',
  description: 'Máy cưa đĩa.',
  price: 3500000,
  stock: 5,
  specs: [{ label: 'Đường kính lưỡi', value: '185mm' }],
  categorySlug: 'may-cua-gia-cong-go',
  images: ['/assets/home/8f51b.png'],
};

const productCount = () => prisma.product.count();

beforeEach(async () => {
  await resetDatabase();
  app = createApp();
  await createAdmin('super@example.com', 'super_admin');
  await createAdmin('pm@example.com', 'product_manager');
  await createAdmin('viewer@example.com', 'viewer', []);
});
afterAll(() => prisma.$disconnect());

describe('login', () => {
  it('sets an HTTP-only, SameSite=Lax, 7-day session cookie for correct credentials', async () => {
    const res = await request(app).post('/api/admin/auth/login').send({ email: 'Super@Example.com', password: PASSWORD }).expect(200);
    expect(res.body).toMatchObject({ email: 'super@example.com', role: 'super_admin', permissions: ['*'] });
    expect(res.body).not.toHaveProperty('passwordHash');
    const cookie = (res.headers['set-cookie'] as unknown as string[]).find(value => value.startsWith(`${SESSION_COOKIE}=`))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Max-Age=604800/);
    expect(await prisma.session.count()).toBe(1);
  });

  it('returns a generic 401 for a wrong password or unknown email', async () => {
    const wrongPassword = await request(app).post('/api/admin/auth/login').send({ email: 'super@example.com', password: 'nope' }).expect(401);
    const unknownEmail = await request(app).post('/api/admin/auth/login').send({ email: 'ghost@example.com', password: PASSWORD }).expect(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.headers['set-cookie']).toBeUndefined();
  });

  it('rejects login for a deactivated admin', async () => {
    await prisma.adminUser.update({ where: { email: 'pm@example.com' }, data: { isActive: false } });
    await request(app).post('/api/admin/auth/login').send({ email: 'pm@example.com', password: PASSWORD }).expect(401);
  });

  it('returns 429 after more than 10 failed logins from one IP within 15 minutes', async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      await request(app).post('/api/admin/auth/login').send({ email: 'super@example.com', password: 'wrong' }).expect(401);
    }
    await request(app).post('/api/admin/auth/login').send({ email: 'super@example.com', password: 'wrong' }).expect(429);
    // Still blocked even with the right password.
    await request(app).post('/api/admin/auth/login').send({ email: 'super@example.com', password: PASSWORD }).expect(429);
  });

  it('does not rate-limit successful logins (11 in a row all succeed)', async () => {
    for (let attempt = 0; attempt < 11; attempt++) {
      await request(app).post('/api/admin/auth/login').send({ email: 'super@example.com', password: PASSWORD }).expect(200);
    }
  });

  it('marks the cookie Secure only when NODE_ENV=production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    try {
      expect(sessionCookieOptions().secure).toBe(true);
    } finally {
      vi.unstubAllEnvs();
    }
    vi.stubEnv('NODE_ENV', 'development');
    try {
      expect(sessionCookieOptions().secure).toBe(false);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('purges expired sessions on a successful login', async () => {
    await loginCookie('pm@example.com');
    await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    await loginCookie('pm@example.com');
    expect(await prisma.session.count()).toBe(1);
  });

  it('me returns the admin, and logout ends the session immediately', async () => {
    const cookie = await loginCookie('pm@example.com');
    const me = await request(app).get('/api/admin/auth/me').set('Cookie', cookie).expect(200);
    expect(me.body).toMatchObject({ email: 'pm@example.com', role: 'product_manager', permissions: ['products:write', 'categories:write'] });
    await request(app).post('/api/admin/auth/logout').set('Cookie', cookie).expect(204);
    await request(app).get('/api/admin/auth/me').set('Cookie', cookie).expect(401);
    expect(await prisma.session.count()).toBe(0);
  });

  it('rejects an expired session and a deactivated admin', async () => {
    const cookie = await loginCookie('pm@example.com');
    await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    await request(app).get('/api/admin/auth/me').set('Cookie', cookie).expect(401);

    const fresh = await loginCookie('pm@example.com');
    await prisma.adminUser.update({ where: { email: 'pm@example.com' }, data: { isActive: false } });
    await request(app).post('/api/admin/products').set('Cookie', fresh).send(validProduct).expect(401);
  });
});

describe('writes without a session', () => {
  it.each([
    ['post', '/api/admin/products'],
    ['put', '/api/admin/products/1'],
    ['delete', '/api/admin/products/1'],
    ['post', '/api/admin/categories'],
    ['put', '/api/admin/categories/1'],
    ['delete', '/api/admin/categories/1'],
  ] as const)('%s %s returns 401 and changes nothing', async (method, path) => {
    const before = await prisma.product.findMany({ orderBy: { id: 'asc' } });
    const categoriesBefore = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    await request(app)[method](path).send({ ...validProduct, name: 'Hacked', slug: 'hacked' }).expect(401);
    await request(app)[method](path).set('Cookie', `${SESSION_COOKIE}=forged-token`).send({ name: 'Hacked' }).expect(401);
    expect(await prisma.product.findMany({ orderBy: { id: 'asc' } })).toEqual(before);
    expect(await prisma.category.findMany({ orderBy: { id: 'asc' } })).toEqual(categoriesBefore);
  });
});

describe('writes without permission', () => {
  it('returns 403 when the role lacks products:write, and changes nothing', async () => {
    const cookie = await loginCookie('viewer@example.com');
    await request(app).post('/api/admin/products').set('Cookie', cookie).send(validProduct).expect(403);
    await request(app).put('/api/admin/products/1').set('Cookie', cookie).send({ name: 'Hacked' }).expect(403);
    await request(app).delete('/api/admin/products/1').set('Cookie', cookie).expect(403);
    await request(app).post('/api/admin/categories').set('Cookie', cookie).send({ slug: 'moi', name: 'Mới' }).expect(403);
  });

  it('returns 403 on PUT and DELETE categories when the role lacks categories:write, and changes nothing', async () => {
    const cookie = await loginCookie('viewer@example.com');
    const before = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    const { id } = await prisma.category.findUniqueOrThrow({ where: { slug: 'phu-kien-dung-cu' } });
    await request(app).put(`/api/admin/categories/${id}`).set('Cookie', cookie).send({ name: 'Hacked' }).expect(403);
    await request(app).delete(`/api/admin/categories/${id}`).set('Cookie', cookie).expect(403);
    expect(await prisma.category.findMany({ orderBy: { id: 'asc' } })).toEqual(before);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: 1 } })).name).not.toBe('Hacked');
  });
});

describe('admin product writes', () => {
  it('creates a product (201) that then appears in the public list without price', async () => {
    const cookie = await loginCookie('pm@example.com');
    const created = await request(app).post('/api/admin/products').set('Cookie', cookie).send(validProduct).expect(201);
    expect(created.body).toMatchObject({ slug: validProduct.slug, price: 3500000, images: validProduct.images, category: { slug: 'may-cua-gia-cong-go' } });

    const list = await request(app).get('/api/products').query({ category: 'may-cua-gia-cong-go' }).expect(200);
    expect(list.body.items.map((item: { slug: string }) => item.slug)).toEqual([validProduct.slug]);
    expect(containsPriceKey(list.body)).toBe(false);
    const detail = await request(app).get(`/api/products/${validProduct.slug}`).expect(200);
    expect(containsPriceKey(detail.body)).toBe(false);
  });

  it('returns 400 with field errors for an invalid body, and creates nothing', async () => {
    const cookie = await loginCookie('super@example.com');
    const res = await request(app).post('/api/admin/products').set('Cookie', cookie)
      .send({ ...validProduct, slug: 'Not A Slug', price: -1, name: '' }).expect(400);
    expect(Object.keys(res.body.fieldErrors).sort()).toEqual(['name', 'price', 'slug']);
    const unknownCategory = await request(app).post('/api/admin/products').set('Cookie', cookie).send({ ...validProduct, categorySlug: 'khong-co' }).expect(400);
    expect(unknownCategory.body.fieldErrors).toHaveProperty('categorySlug');
    expect(await productCount()).toBe(4);
  });

  it('rejects unsafe image URLs and integers beyond INT4 with 400', async () => {
    const cookie = await loginCookie('super@example.com');
    for (const url of ['javascript:alert(1)', 'data:image/png;base64,AAAA', '//evil.example/x.png', 'relative.png']) {
      const res = await request(app).post('/api/admin/products').set('Cookie', cookie).send({ ...validProduct, images: [url] }).expect(400);
      expect(res.body.fieldErrors).toHaveProperty('images');
    }
    await request(app).post('/api/admin/products').set('Cookie', cookie).send({ ...validProduct, images: ['https://cdn.example.com/a.png', '/uploads/a.png'] }).expect(201);
    const huge = await request(app).post('/api/admin/products').set('Cookie', cookie).send({ ...validProduct, slug: 'huge', sku: 'HUGE', price: 2147483648 }).expect(400);
    expect(huge.body.fieldErrors).toHaveProperty('price');
    await request(app).put('/api/admin/products/2147483648').set('Cookie', cookie).send({ name: 'x' }).expect(404);
  });

  it('returns 409 for a duplicate slug', async () => {
    const cookie = await loginCookie('super@example.com');
    await request(app).post('/api/admin/products').set('Cookie', cookie).send({ ...validProduct, slug: 'may-mai-goc-bosch-100-mm' }).expect(409);
  });

  it('updates and deletes a product', async () => {
    const cookie = await loginCookie('pm@example.com');
    const { id } = await prisma.product.findUniqueOrThrow({ where: { slug: 'may-mai-goc-bosch-100-mm' } });
    const updated = await request(app).put(`/api/admin/products/${id}`).set('Cookie', cookie)
      .send({ name: 'Máy mài góc Bosch GWS 060', price: 990000, images: ['/assets/home/9c44c.png', '/assets/home/cc545.png'] }).expect(200);
    expect(updated.body).toMatchObject({ name: 'Máy mài góc Bosch GWS 060', price: 990000, sku: 'GWS-060' });
    expect(updated.body.images).toHaveLength(2);

    await request(app).delete(`/api/admin/products/${id}`).set('Cookie', cookie).expect(204);
    await request(app).get('/api/products/may-mai-goc-bosch-100-mm').expect(404);
    await request(app).delete(`/api/admin/products/${id}`).set('Cookie', cookie).expect(404);
  });
});

describe('admin product partial updates', () => {
  const bosch = () => prisma.product.findUniqueOrThrow({ where: { slug: 'may-mai-goc-bosch-100-mm' }, include: { category: true, images: true } });

  it('moves a product to another category by categorySlug and keeps images when omitted', async () => {
    const cookie = await loginCookie('pm@example.com');
    const { id, images } = await bosch();
    const res = await request(app).put(`/api/admin/products/${id}`).set('Cookie', cookie).send({ categorySlug: 'phu-kien-dung-cu' }).expect(200);
    expect(res.body.category).toEqual({ slug: 'phu-kien-dung-cu', name: 'Phụ kiện & dụng cụ' });
    expect(res.body.images).toEqual(images.map(image => image.url));
    const after = await bosch();
    expect(after.category.slug).toBe('phu-kien-dung-cu');
    expect(after.images.map(image => image.url)).toEqual(images.map(image => image.url));
  });

  it('returns 400 with fieldErrors.categorySlug for an unknown category, and changes nothing', async () => {
    const cookie = await loginCookie('pm@example.com');
    const before = await bosch();
    const res = await request(app).put(`/api/admin/products/${before.id}`).set('Cookie', cookie).send({ categorySlug: 'khong-co', name: 'Đổi tên' }).expect(400);
    expect(res.body.fieldErrors).toHaveProperty('categorySlug');
    expect(await bosch()).toEqual(before);
  });

  it('returns 404 for a missing id', async () => {
    const cookie = await loginCookie('pm@example.com');
    await request(app).put('/api/admin/products/999999').set('Cookie', cookie).send({ name: 'x' }).expect(404);
  });

  it('returns 409 when the new slug is already taken', async () => {
    const cookie = await loginCookie('pm@example.com');
    const { id } = await bosch();
    await request(app).put(`/api/admin/products/${id}`).set('Cookie', cookie).send({ slug: 'mui-khoan-carbide-ngan-6-3-mm' }).expect(409);
    expect((await prisma.product.findUniqueOrThrow({ where: { id } })).slug).toBe('may-mai-goc-bosch-100-mm');
  });
});

describe('re-running the seed', () => {
  it('keeps admin edits to existing products, categories and images', async () => {
    const product = await prisma.product.update({ where: { slug: 'may-mai-goc-bosch-100-mm' }, data: { name: 'Đã sửa', price: 1 } });
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.category.update({ where: { slug: 'may-khoan' }, data: { name: 'Danh mục đã sửa' } });
    await seedCatalogInto(prisma);
    expect(await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).toMatchObject({ name: 'Đã sửa', price: 1 });
    expect(await prisma.productImage.count({ where: { productId: product.id } })).toBe(0);
    expect((await prisma.category.findUniqueOrThrow({ where: { slug: 'may-khoan' } })).name).toBe('Danh mục đã sửa');
    expect(await productCount()).toBe(4);
  });
});

describe('admin category writes', () => {
  it('creates, updates and deletes an empty category', async () => {
    const cookie = await loginCookie('pm@example.com');
    const created = await request(app).post('/api/admin/categories').set('Cookie', cookie).send({ slug: 'thang-nhom', name: 'Thang nhôm', sortOrder: 7 }).expect(201);
    await request(app).put(`/api/admin/categories/${created.body.id}`).set('Cookie', cookie).send({ name: 'Thang nhôm gấp' }).expect(200);
    await request(app).delete(`/api/admin/categories/${created.body.id}`).set('Cookie', cookie).expect(204);
  });

  it('refuses to delete a category that still has products', async () => {
    const cookie = await loginCookie('pm@example.com');
    const { id } = await prisma.category.findUniqueOrThrow({ where: { slug: 'may-khoan' } });
    await request(app).delete(`/api/admin/categories/${id}`).set('Cookie', cookie).expect(409);
    expect(await prisma.category.count()).toBe(6);
  });
});

describe('admin reads, uploads and access management', () => {
  it('returns protected paged product details with price and protected categories', async () => {
    const cookie = await loginCookie('pm@example.com');
    const list = await request(app).get('/api/admin/products').set('Cookie', cookie).query({ q: 'bosch', limit: 1 }).expect(200);
    expect(list.body).toMatchObject({ total: 2, page: 1, limit: 1 });
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0]).toMatchObject({ id: expect.any(Number), price: expect.any(Number) });
    await request(app).get(`/api/admin/products/${list.body.items[0].id}`).set('Cookie', cookie).expect(200);
    await request(app).get('/api/admin/categories').set('Cookie', cookie).expect(200);
    await request(app).get('/api/admin/products').expect(401);
    const viewer = await loginCookie('viewer@example.com');
    await request(app).get('/api/admin/products').set('Cookie', viewer).expect(403);
  });

  it('rejects invalid uploads and accepts a signature-checked PNG for a product manager', async () => {
    const cookie = await loginCookie('pm@example.com');
    await request(app).post('/api/admin/uploads').set('Cookie', cookie).set('Content-Type', 'image/png').send(Buffer.from('not-an-image')).expect(400);
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
    const uploaded = await request(app).post('/api/admin/uploads').set('Cookie', cookie).set('Content-Type', 'image/png').send(png).expect(201);
    expect(uploaded.body.url).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);
    await request(app).get(uploaded.body.url).expect(200);
    const viewer = await loginCookie('viewer@example.com');
    await request(app).post('/api/admin/uploads').set('Cookie', viewer).set('Content-Type', 'image/png').send(png).expect(403);
  });

  it('limits role and user lists to super-admins and immediately revokes a deactivated admin session', async () => {
    const superCookie = await loginCookie('super@example.com');
    const pmCookie = await loginCookie('pm@example.com');
    await request(app).get('/api/admin/users').set('Cookie', pmCookie).expect(403);
    const users = await request(app).get('/api/admin/users').set('Cookie', superCookie).expect(200);
    expect(users.body.items[0]).not.toHaveProperty('passwordHash');
    await request(app).get('/api/admin/roles').set('Cookie', superCookie).expect(200);
    const pm = users.body.items.find((user: { email: string }) => user.email === 'pm@example.com');
    await request(app).post(`/api/admin/users/${pm.id}/deactivate`).set('Cookie', superCookie).expect(204);
    await request(app).get('/api/admin/auth/me').set('Cookie', pmCookie).expect(401);
    await request(app).post(`/api/admin/users/${users.body.items.find((user: { email: string }) => user.email === 'super@example.com').id}/deactivate`).set('Cookie', superCookie).expect(409);
  });
});
