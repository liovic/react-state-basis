import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/production.ts'], 
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ['react'],
  },
  {
    entry: { 'plugin': 'src/babel-plugin.js' },
    format: ['cjs'],
    dts: false,
    clean: false,
  }
]);