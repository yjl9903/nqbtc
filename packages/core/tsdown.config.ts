import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: { tsconfig: '../../tsconfig.json' },
  clean: true
});
