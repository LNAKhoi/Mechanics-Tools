import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd(), 'src'); const files = [];
function walk(dir) { for (const entry of readdirSync(dir, { withFileTypes: true })) { const path = join(dir, entry.name); if (path.includes(join('pages', 'admin'))) continue; entry.isDirectory() ? walk(path) : entry.name.endsWith('.tsx') && files.push(path); } }
walk(root); let count = 0;
for (const file of files) { const source = readFileSync(file, 'utf8'); for (const match of source.matchAll(/(?<![\w:-])(min-w|w)-\[\d{4}px\]/g)) { const before = source.slice(Math.max(0, match.index - 8), match.index); if (!before.includes('xl:')) { console.log(`${file.replace(process.cwd(), '.')} :: ${match[0]}`); count++; } } }
if (count) { console.error(`Found ${count} fixed mobile width classes.`); process.exitCode = 1; } else console.log('No unprefixed fixed width classes found.');
