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
            '/api': 'http://localhost:11346',
            '/scrape': 'http://localhost:11346',
            '/scraper': 'http://localhost:11346',
            '/agent': 'http://localhost:11346',
            '/headful': 'http://localhost:11346',
            '/tasks': 'http://localhost:11346',
            '/screenshots': 'http://localhost:11346',
        },
    },
    build: {
        outDir: 'dist',
    },
});
