import { execSync } from 'node:child_process';

/**
 * Applies pending migrations to the test database (created if missing) once per `npm test` run.
 * Each test file then empties and re-seeds the tables itself (see helpers.ts).
 */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL is not set');
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}
