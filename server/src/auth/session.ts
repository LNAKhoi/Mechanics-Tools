import { createHash, randomBytes } from 'node:crypto';
import type { CookieOptions } from 'express';
import { prisma } from '../db.js';

export const SESSION_COOKIE = 'lee_admin_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export const sessionCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
});

export async function createSession(adminUserId: number) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({ data: { id: hashToken(token), adminUserId, expiresAt } });
  return { token, expiresAt };
}

export async function findValidSession(token: string) {
  const session = await prisma.session.findUnique({ where: { id: hashToken(token) }, include: { adminUser: { include: { role: true } } } });
  if (!session) return null;
  if (session.expiresAt <= new Date() || !session.adminUser.isActive) {
    if (session.expiresAt <= new Date()) await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session;
}

export const deleteSession = (token: string) => prisma.session.deleteMany({ where: { id: hashToken(token) } });
