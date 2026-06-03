import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-3d': ['three', 'react-globe.gl'],
          'vendor-utils': ['@supabase/supabase-js', 'jose']
        }
      }
    }
  }
});
