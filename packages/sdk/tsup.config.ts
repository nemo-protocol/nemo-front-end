import { defineConfig } from 'tsup'
import { resolve } from 'path'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
  external: ['react', 'react-dom', '@tanstack/react-query'],
  esbuildOptions(options) {
    options.alias = {
      '@': resolve(__dirname, './src')
    }
  }
}) 