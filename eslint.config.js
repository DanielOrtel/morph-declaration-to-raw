// ESLint configuration
// http://eslint.org/docs/user-guide/configuring

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

const IGNORE = [
  '**/.*',
  '**/.dist/**/*',
  '**/.prod/**/*',
  '**/coverage/**/*',
  '**/node_modules/**/*',
  '**/docs/**/*',
  '**/static/**/*',
  '**/public/**/*',
  '**/jest.config.js',
  '**/.prettierrc.js',
  '**/eslint.config.js',
  '**/rollup.config.js'
];

export default tseslint.config(
  // do not add any extra configs to this, it will break global ignores. The 'ignores' field needs to sit in a config of it's own
  {
    ignores: IGNORE
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        myCustomGlobal: 'readonly'
      }
    },
    rules: {
      // Typescript specific
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          caughtErrors: 'none'
        }
      ],
      '@typescript-eslint/no-empty-object-type': [
        'error',
        {
          allowInterfaces: 'with-single-extends'
        }
      ],
      // Import specific
      'import/prefer-default-export': 'off',
      'import/no-extraneous-dependencies': ['error', { packageDir: '.' }],
      'import/no-absolute-path': 'off',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never'
        }
      ],
      'import/order': [
        'error',
        { groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'] }
      ],
      // general eslint rules
      'no-console': [
        'error',
        {
          allow: ['warn', 'error', 'info']
        }
      ],
      'prefer-const': [
        'error',
        {
          destructuring: 'all',
          ignoreReadBeforeAssign: false
        }
      ],
      'prefer-destructuring': [
        'error',
        {
          VariableDeclarator: {
            array: false,
            object: true
          },
          AssignmentExpression: {
            array: false,
            object: false
          }
        },
        {
          enforceForRenamedProperties: false
        }
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ForInStatement',
          message:
            'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.'
        },
        {
          selector: 'LabeledStatement',
          message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.'
        },
        {
          selector: 'WithStatement',
          message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.'
        },
        {
          selector: 'TSEnumDeclaration',
          message: "Don't declare enums."
        }
      ],
      'no-useless-constructor': 'off'
    },
    settings: {
      // Allow absolute paths in imports, e.g. import Button from 'components/Button'
      // https://github.com/benmosher/eslint-plugin-import/tree/master/resolvers
      'import/resolver': {
        node: {
          moduleDirectory: ['node_modules', 'src/', './']
        },
        typescript: {
          moduleDirectory: ['node_modules', 'src/', './']
        },
        webpack: {
          config: {
            resolve: {
              modules: ['node_modules', 'src/', './']
            }
          }
        }
      },
      react: {
        version: 'detect', // React version. "detect" automatically picks the version you have installed.
        defaultVersion: '', // Default React version to use when the version you have installed cannot be detected.
        flowVersion: '0.53' //
      }
    }
  },
  {
    files: ['**/e2e/**/*.js'],
    rules: {
      'no-undef': 'off',
      'import/no-unresolved': 'off'
    }
  }
);
