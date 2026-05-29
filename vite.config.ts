import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// The marketing site's phone preview renders the *real* app screens rather
// than forked copies, so it can never drift out of sync with the product.
// `@` therefore resolves into the sibling app's source tree (the app uses
// `@/...` imports internally); `~` is the marketing site's own source.
const appSrc = path.resolve(__dirname, '../nynjwc-frontend/src');
const ownSrc = path.resolve(__dirname, 'src');

// `base: './'` produces relative asset URLs, so the build works at any
// GitHub Pages subpath (user.github.io/, user.github.io/repo-name/, or a
// custom CNAME) without per-deploy config.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': appSrc,
      '~': ownSrc,
    },
  },
  server: {
    // Vite dev sandboxes file reads to the project root; the preview imports
    // the sibling app source, so allow reads from the shared parent dir.
    fs: { allow: [path.resolve(__dirname, '..')] },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Three entry points: the public landing page, the unadvertised
    // event-entry tool, and the privacy policy (linked from Play Store /
    // App Store listings). `submit.html` and `privacy.html` build as plain
    // static pages — prerender (scripts/prerender.mjs) only rewrites
    // index.html, so they ship as-authored.
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        submit: path.resolve(__dirname, 'submit.html'),
        privacy: path.resolve(__dirname, 'privacy.html'),
      },
    },
  },
});
