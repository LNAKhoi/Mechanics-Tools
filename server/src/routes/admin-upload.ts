import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import express from 'express';
import { requireAdmin, requirePermission } from '../auth/middleware.js';
import { uploadsDir } from '../app.js';

const imageType = (type: string | undefined, b: Buffer) => {
  if (type === 'image/png' && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return '.png';
  if (type === 'image/jpeg' && b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return '.jpg';
  if (type === 'image/webp' && b.length > 12 && b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return '.webp';
  return null;
};

export const adminUploadRouter = Router();
adminUploadRouter.use(requireAdmin);
adminUploadRouter.post('/uploads', (req, res, next) => (req.admin?.permissions.includes('*') || req.admin?.permissions.includes('products:write') || req.admin?.permissions.includes('content:write')) ? next() : res.status(403).json({ error: 'Không có quyền thực hiện thao tác này' }), express.raw({ type: () => true, limit: '5mb' }), (req, res, next) => {
  const bytes = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  const extension = imageType(req.headers['content-type']?.split(';')[0], bytes);
  if (!extension) return void res.status(400).json({ error: 'Tệp ảnh không hợp lệ. Chỉ nhận PNG, JPEG hoặc WebP.' });
  void (async () => {
    await fs.mkdir(uploadsDir, { recursive: true });
    const filename = `${randomUUID()}${extension}`;
    await fs.writeFile(path.join(uploadsDir, filename), bytes, { flag: 'wx' });
    res.status(201).json({ url: `/uploads/${filename}` });
  })().catch(next);
});
