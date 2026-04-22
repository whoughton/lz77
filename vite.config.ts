import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'index.ts',
      name: 'LZ77',
      fileName: (format) => `lz77.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['index.ts'],
      exclude: ['index_legacy.ts', 'bench.ts', 'bench-compare.ts'],
      thresholds: {
        lines: 75,
        functions: 90,
        branches: 60,
      },
      reporter: ['text', 'lcov'],
    },
  },
}); 