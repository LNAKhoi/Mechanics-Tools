import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react';

const apiTarget = 'http://localhost:4000';

export default defineConfig({ plugins: [react()], server: { proxy: { '/api': apiTarget, '/uploads': apiTarget, '/sitemap.xml': apiTarget, '/robots.txt': apiTarget } } });
