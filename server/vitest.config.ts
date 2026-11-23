import 'dotenv/config';
import { defineConfig } from 'vitest/config';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) throw new Error('TEST_DATABASE_URL is not set (see server/.env.example).');
// Compare database names, not raw strings, so localhost vs 127.0.0.1 or extra params cannot bypass the guard.
const databaseName = (url: string) => decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));
if (process.env.DATABASE_URL && databaseName(testDatabaseUrl) === databaseName(process.env.DATABASE_URL)) {
  throw new Error('TEST_DATABASE_URL must name a different database than DATABASE_URL: the test database is wiped on every run.');
}
// Worker processes inherit this value before their modules instantiate Prisma.
process.env.DATABASE_URL = testDatabaseUrl;

export default defineConfig({
  test: {
    environment: 'node',
    env: { DATABASE_URL: testDatabaseUrl, TEST_DATABASE_URL: testDatabaseUrl, NODE_ENV: 'test' },
    globalSetup: './test/global-setup.ts',
    setupFiles: './test/setup.ts',
    // All test files share one database.
    pool: 'forks',
    singleFork: true,
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
