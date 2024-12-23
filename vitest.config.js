import { defineConfig } from 'vitest/config';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig({
  plugins: [
    nodeResolve({
      moduleDirectories: ['node_modules', '.', 'src'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.es', '.es6', '.mjs', 'json']
    })
  ],
  test: {
    typecheck: {
      tsconfig: './tsconfig.test.json'
    }
  }
});
