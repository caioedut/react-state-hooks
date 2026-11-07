import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/types.ts'],
      reporter: ['text', 'html', 'lcov'],
      // Enforced only when running with `--coverage` (see `test:coverage`)
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
