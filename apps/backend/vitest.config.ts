import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@repo/config': path.resolve(
        __dirname,
        '../../packages/config/src/index.ts'
      ),

      // vitest (node resolver) does not reliably follow workspace package
      // exports pointing at ts sources. alias directly to the workspace source.
      '@repo/db/schemas': path.resolve(
        __dirname,
        '../../packages/db/src/schemas/index.ts'
      ),
      '@repo/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
    },
  },
});
