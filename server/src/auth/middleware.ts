import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { findValidSession, SESSION_COOKIE } from './session.js';

export type AdminContext = { id: number; email: string; name: string; role: string; permissions: string[] };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminContext;
    }
  }
}

export const sessionToken = (req: Request): string | undefined => {
  const value = req.cookies?.[SESSION_COOKIE];
  return typeof value === 'string' && value ? value : undefined;
};

/** Rejects with 401 unless the request carries a valid, unexpired session of an active admin. */
export const requireAdmin: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const token = sessionToken(req);
  const session = token ? await findValidSession(token) : null;
  if (!session) {
    res.status(401).json({ error: 'Chưa đăng nhập' });
    return;
  }
  const { adminUser } = session;
  req.admin = { id: adminUser.id, email: adminUser.email, name: adminUser.name, role: adminUser.role.name, permissions: adminUser.role.permissions };
  next();
};

export const hasPermission = (permissions: string[], permission: string) => permissions.includes('*') || permissions.includes(permission);

/** Must run after requireAdmin. Rejects with 403 when the admin's role lacks the permission. */
export const requirePermission = (permission: string): RequestHandler => (req, res, next) => {
  if (!req.admin) {
    res.status(401).json({ error: 'Chưa đăng nhập' });
    return;
  }
  if (!hasPermission(req.admin.permissions, permission)) {
    res.status(403).json({ error: 'Không có quyền thực hiện thao tác này' });
    return;
  }
  next();
};
