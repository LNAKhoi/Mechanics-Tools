import request from 'supertest';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/auth/password.js';
import { prisma, resetDatabase } from './helpers.js';
import { importTestHooks } from '../src/routes/admin-import.js';

const headers=['Mã sản phẩm (SKU) *','Tên sản phẩm *','Danh mục *','Thương hiệu','Giá (VNĐ)','Tồn kho','Bán chạy','Mô tả','Thông số','Ảnh'];
const png=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]);
let app:ReturnType<typeof createApp>;
async function book(rows:string[][],headersOverride=headers){const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('Sản phẩm');ws.addRow(headersOverride);rows.forEach(r=>ws.addRow(r));return Buffer.from(await wb.xlsx.writeBuffer());}
async function cookie(){const role=await prisma.role.findUniqueOrThrow({where:{name:'product_manager'}});await prisma.adminUser.create({data:{email:'import@example.com',name:'Import',passwordHash:await hashPassword('test-password-123'),roleId:role.id}});const res=await request(app).post('/api/admin/auth/login').send({email:'import@example.com',password:'test-password-123'});return (res.headers['set-cookie'] as string[]).map(x=>x.split(';')[0]);}
beforeEach(async()=>{importTestHooks.reset();await resetDatabase();app=createApp()});afterAll(()=>prisma.$disconnect());
describe('Excel import preview',()=>{
 it('reports new, update and invalid rows without saving before confirm',async()=>{const c=await cookie();const bytes=await book([['NEW-1','Sản phẩm mới','may-khoan','LEE','100','2','Có','','','a.png'],['GWS-060','Máy mài sửa','may-mai-may-cat','','','','','','',''],['BAD','','may-khoan','','','','','','','']]);const res=await request(app).post('/api/admin/products/import/preview').set('Cookie',c).attach('file',bytes,'products.xlsx').attach('images',png,{filename:'a.png',contentType:'image/png'}).expect(200);expect(res.body.counts).toEqual({added:1,updated:1,skipped:1});expect(await prisma.product.count()).toBe(4);const done=await request(app).post(`/api/admin/products/import/${res.body.id}/confirm`).set('Cookie',c).expect(200);expect(done.body).toMatchObject({added:1,updated:1,skipped:1});});
 it('rejects wrong templates and denies a missing session',async()=>{const bytes=await book([],headers.slice(0,9));await request(app).post('/api/admin/products/import/preview').attach('file',bytes,'products.xlsx').expect(401);const c=await cookie();await request(app).post('/api/admin/products/import/preview').set('Cookie',c).attach('file',bytes,'products.xlsx').expect(400);});
});

async function cookieFor(roleName: string, email: string) {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  await prisma.adminUser.create({ data: { email, name: email, passwordHash: await hashPassword('test-password-123'), roleId: role.id } });
  const res = await request(app).post('/api/admin/auth/login').send({ email, password: 'test-password-123' });
  return (res.headers['set-cookie'] as string[]).map(value => value.split(';')[0]);
}

async function zip(entries: Record<string, Buffer>) {
  const archive = new JSZip();
  Object.entries(entries).forEach(([name, bytes]) => archive.file(name, bytes));
  return Buffer.from(await archive.generateAsync({ type: 'nodebuffer' }));
}

const realPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlMfRUAAAAASUVORK5CYII=', 'base64');
const realJpeg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/Aaf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/Aaf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Ap//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z', 'base64');

describe('Excel import edge cases', () => {
  it('previews the approved on-disk template and ignores its formatted empty rows', async () => {
    const c = await cookie();
    const template = await readFile(path.resolve(process.cwd(), '../public/templates/mau-nhap-san-pham.xlsx'));
    const preview = await request(app).post('/api/admin/products/import/preview').set('Cookie', c)
      .attach('file', template, 'mau-nhap-san-pham.xlsx').expect(200);
    expect(preview.body.rows).toHaveLength(3);
    expect(preview.body.rows.map((row: { sku: string }) => row.sku)).toEqual(['DTD171Z', 'GWS750-100', 'M18FIW2F12']);
    expect(preview.body.counts).toEqual({ added: 2, updated: 1, skipped: 0 });
    expect(preview.body.rows.map((row: { sku: string; status: string }) => ({ sku: row.sku, status: row.status }))).toEqual([
      { sku: 'DTD171Z', status: 'update' },
      { sku: 'GWS750-100', status: 'new' },
      { sku: 'M18FIW2F12', status: 'new' },
    ]);
    expect(preview.body.rows[0].note).toContain('Cảnh báo');
    expect(preview.body.rows[2].note).toBe('');
  });

  it('matches uploaded names and https links, and warns for a fake image', async () => {
    const c = await cookie();
    const bytes = await book([
      ['IMG-1', 'Image product', 'may-khoan', '', '', '', '', '', '', 'A.JPG; https://example.test/remote.jpg'],
      ['IMG-2', 'Fake image', 'may-khoan', '', '', '', '', '', '', 'fake.jpg'],
    ]);
    const preview = await request(app).post('/api/admin/products/import/preview').set('Cookie', c)
      .attach('file', bytes, 'products.xlsx').attach('images', realJpeg, 'a.jpg').attach('images', Buffer.from('not an image'), 'fake.jpg').expect(200);
    expect(preview.body.rows[0].status).toBe('new');
    expect(preview.body.rows[1].note).toContain('ảnh không hợp lệ');
    await request(app).post(`/api/admin/products/import/${preview.body.id}/confirm`).set('Cookie', c).expect(200);
    const product = await prisma.product.findUniqueOrThrow({ where: { sku: 'IMG-1' }, include: { images: { orderBy: { sortOrder: 'asc' } } } });
    expect(product.images.map(image => image.url)).toEqual([expect.stringMatching(/^\/uploads\//), 'https://example.test/remote.jpg']);
  });

  it('matches images in a zip and rejects unsafe or oversized zip input', async () => {
    const c = await cookie(); const bytes = await book([['ZIP-1', 'Zip product', 'may-khoan', '', '', '', '', '', '', 'a.jpg']]);
    const good = await zip({ 'img/A.JPG': realJpeg });
    const preview = await request(app).post('/api/admin/products/import/preview').set('Cookie', c).attach('file', bytes, 'products.xlsx').attach('zip', good, 'images.zip').expect(200);
    expect(preview.body.rows[0].note).toBe('');
    const evil = await zip({ '../evil.jpg': realJpeg });
    await request(app).post('/api/admin/products/import/preview').set('Cookie', c).attach('file', bytes, 'products.xlsx').attach('zip', evil, 'evil.zip').expect(400);
    importTestHooks.setMaxZipUncompressed(10);
    const large = await zip({ 'large.jpg': Buffer.concat([realJpeg, Buffer.alloc(100)]) });
    await request(app).post('/api/admin/products/import/preview').set('Cookie', c).attach('file', bytes, 'products.xlsx').attach('zip', large, 'large.zip').expect(400);
  });

  it('marks bad categories and duplicate file SKUs as row errors', async () => {
    const c = await cookie(); const bytes = await book([
      ['BAD-CAT', 'Bad category', 'does-not-exist'],
      ['DUP-1', 'First', 'may-khoan'], [' dup-1 ', 'Second', 'may-khoan'],
    ]);
    const preview = await request(app).post('/api/admin/products/import/preview').set('Cookie', c).attach('file', bytes, 'products.xlsx').expect(200);
    expect(preview.body.counts).toEqual({ added: 1, updated: 0, skipped: 2 });
    expect(preview.body.rows[2].note).toContain('SKU trùng với dòng 3');
  });

  it('applies only populated fields when updating an existing SKU', async () => {
    const c = await cookie(); const before = await prisma.product.findUniqueOrThrow({ where: { sku: 'GWS-060' } });
    const bytes = await book([[' gws-060 ', before.name, '', '', '', '9']]);
    const preview = await request(app).post('/api/admin/products/import/preview').set('Cookie', c).attach('file', bytes, 'products.xlsx').expect(200);
    expect(preview.body.counts).toEqual({ added: 0, updated: 1, skipped: 0 });
    await request(app).post(`/api/admin/products/import/${preview.body.id}/confirm`).set('Cookie', c).expect(200);
    const after = await prisma.product.findUniqueOrThrow({ where: { sku: 'GWS-060' } });
    expect(after.stock).toBe(9); expect(after.name).toBe(before.name);
  });

  it('returns 400 for missing sheets, empty sheets, and corrupt workbooks', async () => {
    const c = await cookie();
    const noSheet = new ExcelJS.Workbook(); noSheet.addWorksheet('Other').addRow(headers);
    const noSheetBytes = Buffer.from(await noSheet.xlsx.writeBuffer());
    const empty = await book([]);
    for (const [bytes, name] of [[noSheetBytes, 'no-sheet.xlsx'], [empty, 'empty.xlsx'], [Buffer.from('broken'), 'broken.xlsx']] as const) {
      const response = await request(app).post('/api/admin/products/import/preview').set('Cookie', c).attach('file', bytes, name).expect(400);
      expect(response.body.error).toContain('File không đúng mẫu');
    }
  });

  it('does not confirm expired or another administrator staging sessions', async () => {
    const owner = await cookieFor('product_manager', 'owner@example.com'); const other = await cookieFor('product_manager', 'other@example.com');
    const bytes = await book([['STAGE-1', 'Staged', 'may-khoan']]);
    const preview = await request(app).post('/api/admin/products/import/preview').set('Cookie', owner).attach('file', bytes, 'products.xlsx').expect(200);
    await request(app).post(`/api/admin/products/import/${preview.body.id}/confirm`).set('Cookie', other).expect(404);
    importTestHooks.expire(preview.body.id);
    await request(app).post(`/api/admin/products/import/${preview.body.id}/confirm`).set('Cookie', owner).expect(404);
  });

  it('denies content editors', async () => {
    const c = await cookieFor('content_editor', 'content@example.com'); const bytes = await book([['NOPE-1', 'Nope', 'may-khoan']]);
    await request(app).post('/api/admin/products/import/preview').set('Cookie', c).attach('file', bytes, 'products.xlsx').expect(403);
    await request(app).post('/api/admin/products/import/anything/confirm').set('Cookie', c).expect(403);
  });
});
