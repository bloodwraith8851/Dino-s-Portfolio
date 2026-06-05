import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    // Bundle analysis: run `ANALYZE=true npm run build` to generate stats.html
    ...(process.env.ANALYZE === 'true'
      ? [visualizer({ open: true, filename: 'stats.html', gzipSize: true, brotliSize: true })]
      : []),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-3d': ['three', 'react-globe.gl'],
          'vendor-utils': ['@supabase/supabase-js', 'jose'],
        },
      },
    },
  },
});
