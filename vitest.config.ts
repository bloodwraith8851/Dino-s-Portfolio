import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
    exclude: ['e2e/**/*', 'node_modules/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],

      exclude: ['node_modules/**', 'e2e/**', 'dist/**', '**/*.d.ts', 'src/__tests__/**', 'src/main.tsx', 'api/**'],
    },
  },
});
