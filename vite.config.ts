import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Served behind nginx at https://excellenceplus.id/admin/, not at a root.
  // Every asset URL and the router basename derive from this.
  base: '/admin/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].mjs',
        chunkFileNames: 'assets/[name]-[hash].mjs',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
