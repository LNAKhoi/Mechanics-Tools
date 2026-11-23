// Vitest's `env` option is exposed to transformed modules, but Prisma reads
// process.env while test modules load. Set the real process environment before
// any application import so every Prisma client uses the isolated test DB.
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
