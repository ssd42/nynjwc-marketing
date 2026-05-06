import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// `base: './'` produces relative asset URLs, so the build works at any
// GitHub Pages subpath (user.github.io/, user.github.io/repo-name/, or a
// custom CNAME) without per-deploy config.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
