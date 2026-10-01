import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5174,
    open: false,
    watch: {
      ignored: ['**/public/models/**', '**/*.glb', '**/*.hdr', '**/dist/**']
    }
  },
  publicDir: 'public',
  build: {
    chunkSizeWarningLimit: 1200
  }
});
