module.exports = {
  verbose: true,
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.jest.json',
      babelConfig: true,
      isolatedModules: true,
    },
  },
  moduleNameMapper: {
    'app/plugins/sdk': '<rootDir>/node_modules/grafana-sdk-mocks/app/plugins/sdk.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(grafana-sdk-mocks))',
  ],
  testRegex: '(\\.|/)([jt]est)\\.ts$',
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
  ],
  preset: 'ts-jest',
  testMatch: null,
};
