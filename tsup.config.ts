// tsup.config.ts

import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: [
      'src/index.ts',
      'src/production.ts',
      'src/vite-plugin.ts',
      'src/jsx-runtime.ts',
      'src/jsx-dev-runtime.ts',
      'src/client.ts',
      'src/integrations/zustand.ts',
      'src/integrations/zustand-production.ts'
    ],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ['react', 'react-dom', 'vite'],
  },
  {
    entry: { 'plugin': 'src/babel-plugin.js' },
    format: ['cjs'],
    dts: false,
    clean: false,
  }
]);