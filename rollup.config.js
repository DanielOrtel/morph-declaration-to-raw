import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';

import { nodeExternals } from 'rollup-plugin-node-externals';
import typescript from '@rollup/plugin-typescript';
import globImport from 'rollup-plugin-glob-import';
import transformPaths from 'typescript-transform-paths';
import { esmLibraryPresets, basePlugins } from './babel.js';

export default {
  input: './src/index.ts',
  output: {
    sourcemap: true,
    dir: './.dist',
    format: 'esm',
    preserveModules: true
  },
  plugins: [
    nodeExternals({ deps: true }),
    nodeResolve({
      moduleDirectories: ['node_modules', 'src'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.es', '.es6', '.mjs']
    }),
    typescript({
      include: ['node_modules/@types/*', '{,**/}*.(cts|mts|ts|tsx)'],
      noForceEmit: true,
      transformers: {
        afterDeclarations: [
          {
            type: 'program',
            // todo: exclude fails for symlinks: https://github.com/LeDDGroup/typescript-transform-paths/issues/325
            factory: (program) =>
              transformPaths.default(program, { exclude: ['**/@mumush-libraries/**/**', '**/node_modules/**'] })
          }
        ]
      }
    }),
    babel({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      babelHelpers: 'runtime',
      exclude: /node_modules/,
      presets: [...esmLibraryPresets],
      plugins: [...basePlugins]
    }),
    globImport({
      format: 'default'
    })
  ]
};
