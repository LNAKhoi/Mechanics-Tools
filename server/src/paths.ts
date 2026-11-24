import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Kept separate from app.ts so route modules can safely import it during app setup.
const here = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.resolve(here, here.includes(`${path.sep}dist${path.sep}`) ? '../../uploads' : '../uploads');
export const importStagingDir = path.resolve(uploadsDir, '..', '.import-staging');
