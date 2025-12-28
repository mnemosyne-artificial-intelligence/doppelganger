import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 11345,
        proxy: {
            '/api': 'http://localhost:11345',
            '/scrape': 'http://localhost:11345',
            '/scraper': 'http://localhost:11345',
            '/agent': 'http://localhost:11345',
            '/headful': 'http://localhost:11345',
            '/tasks': 'http://localhost:11345',
            '/screenshots': 'http://localhost:11345',
        },
    },
    build: {
        outDir: 'dist',
    },
});
