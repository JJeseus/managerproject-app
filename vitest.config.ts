import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      'server-only': path.resolve(__dirname, 'tests/mocks/server-only.ts'),
      '@': path.resolve(__dirname),
    },
  },
})
