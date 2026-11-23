import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAdmin, sessionToken } from './middleware.js';
import { DUMMY_HASH, MAX_PASSWORD_BYTES, passwordBytes, verifyPassword } from './password.js';
import { createSession, deleteSession, SESSION_COOKIE, SESSION_TTL_MS, sessionCookieOptions } from './session.js';

const loginBody = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(1).refine(value => passwordBytes(value) <= MAX_PASSWORD_BYTES) });
const INVALID_CREDENTIALS = 'Email hoặc mật khẩu không đúng';

export function createAuthRouter() {
  const router = Router();

  // Counts only failed attempts: the 11th failure from one IP within 15 minutes gets 429.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.' },
  });

  router.post('/login', loginLimiter, async (req, res) => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(401).json({ error: INVALID_CREDENTIALS });
      return;
    }
    const { email, password } = parsed.data;
    const admin = await prisma.adminUser.findUnique({ where: { email }, include: { role: true } });
    const passwordOk = await verifyPassword(password, admin?.passwordHash ?? DUMMY_HASH);
    if (!admin || !admin.isActive || !passwordOk) {
      res.status(401).json({ error: INVALID_CREDENTIALS });
      return;
    }
    await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    const { token } = await createSession(admin.id);
    res.cookie(SESSION_COOKIE, token, { ...sessionCookieOptions(), maxAge: SESSION_TTL_MS });
    res.json({ id: admin.id, email: admin.email, name: admin.name, role: admin.role.name, permissions: admin.role.permissions });
  });

  router.post('/logout', async (req, res) => {
    const token = sessionToken(req);
    if (token) await deleteSession(token);
    res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
    res.status(204).end();
  });

  router.get('/me', requireAdmin, (req, res) => {
    res.json(req.admin);
  });

  return router;
}
