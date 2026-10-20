import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // BASE lets the same build run from a sub-path (e.g. a preview host); production stays at '/'.
  base: process.env.BASE ?? '/',
  plugins: [react()],
  // three.js ships in its own lazy chunk, loaded only when the browser has WebGL2
  build: { chunkSizeWarningLimit: 600 },
  server: { port: 3000, host: '0.0.0.0' },
});
