export const lodashPlugin = [
  'import',
  {
    libraryName: 'lodash',
    libraryDirectory: '',
    camel2DashComponentName: false,
    customName: (name) => {
      return `lodash/${name}.js`;
    }
  },
  'plugin-lodash'
];

export const basePlugins = [
  '@babel/plugin-proposal-export-default-from',
  [
    '@babel/plugin-transform-runtime',
    {
      useESModules: true
    }
  ],
  lodashPlugin,
  [
    'module-resolver',
    {
      root: ['./', './src']
    }
  ]
];

export const esmLibraryPresets = [
  '@babel/preset-typescript',
  [
    '@babel/env',
    {
      modules: false,
      loose: true,
      targets: {
        browsers: 'node 20'
      }
    }
  ]
];
