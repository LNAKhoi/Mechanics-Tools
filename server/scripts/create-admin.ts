/**
 * Creates a super_admin interactively: `npm run create-admin`.
 * The password is typed into a hidden prompt and only its bcrypt hash is stored.
 */
import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { hashPassword, MAX_PASSWORD_BYTES, passwordBytes } from '../src/auth/password.js';
import { seedRolesInto } from '../prisma/seed-data.js';

const MIN_PASSWORD_LENGTH = 10;

async function ask(question: string) {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/** Reads a line from a TTY without echoing it. */
function askHidden(question: string): Promise<string> {
  if (!stdin.isTTY) throw new Error('Password prompt needs an interactive terminal.');
  return new Promise((resolve, reject) => {
    let value = '';
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const done = (error?: Error) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off('data', onData);
      stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') return done();
        if (char === '\u0003') return done(new Error('Cancelled.'));
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else if (char >= ' ') value += char;
      }
    };
    stdin.on('data', onData);
  });
}

const prisma = new PrismaClient();

try {
  const email = z.string().trim().toLowerCase().email().max(254).parse(await ask('Email: '));
  const name = z.string().trim().min(1).parse(await ask('Name: '));
  const password = await askHidden(`Password (min ${MIN_PASSWORD_LENGTH} characters): `);
  if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (passwordBytes(password) > MAX_PASSWORD_BYTES) throw new Error(`Password must be at most ${MAX_PASSWORD_BYTES} bytes (UTF-8).`);
  if ((await askHidden('Confirm password: ')) !== password) throw new Error('Passwords do not match.');

  if (await prisma.adminUser.findUnique({ where: { email } })) throw new Error(`An admin with email ${email} already exists.`);
  await seedRolesInto(prisma);
  const role = await prisma.role.findUniqueOrThrow({ where: { name: 'super_admin' } });
  await prisma.adminUser.create({ data: { email, name, passwordHash: await hashPassword(password), roleId: role.id } });
  console.log(`Created super_admin ${email}.`);
} catch (error) {
  console.error(error instanceof z.ZodError ? `Invalid input: ${error.issues.map(issue => issue.message).join(', ')}` : (error as Error).message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
