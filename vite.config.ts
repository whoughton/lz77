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
}); 