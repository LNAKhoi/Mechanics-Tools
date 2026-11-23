import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express, { type ErrorRequestHandler } from 'express';
import { createAuthRouter } from './auth/routes.js';
import { adminCatalogRouter } from './routes/admin-catalog.js';
import { adminUploadRouter } from './routes/admin-upload.js';
import { adminUsersRouter } from './routes/admin-users.js';
import { catalogRouter } from './routes/catalog.js';
import { contentRouter } from './routes/content.js';
import { adminContentRouter } from './routes/admin-content.js';
import { seoRouter } from './routes/seo.js';

// server/uploads, both from src/ (tsx) and dist/src/ (compiled).
const here = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.resolve(here, here.includes(`${path.sep}dist${path.sep}`) ? '../../uploads' : '../uploads');

/** Builds a fresh app (with fresh rate-limit state), so tests get isolated instances. */
export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/uploads', express.static(uploadsDir, { fallthrough: false }));
  app.use(seoRouter);
  app.use('/api/admin/auth', createAuthRouter());
  app.use('/api/admin', adminCatalogRouter);
  app.use('/api/admin', adminUploadRouter);
  app.use('/api/admin', adminContentRouter);
  // Content editors must reach these routes before the super-admin-only users router.
  app.use('/api/admin', adminUsersRouter);
  app.use('/api', catalogRouter);
  app.use('/api', contentRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Không tìm thấy' });
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error?.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'JSON không hợp lệ' });
      return;
    }
    const status = error?.code === 'LIMIT_FILE_SIZE' ? 413 : typeof error?.status === 'number' && error.status >= 400 && error.status < 500 ? error.status : 500;
    if (status === 500) console.error(error);
    res.status(status).json({ error: status === 500 ? 'Lỗi máy chủ' : 'Yêu cầu không hợp lệ' });
  };
  app.use(errorHandler);
  return app;
}
