module.exports = {
  verbose: true,
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.jest.json',
      babelConfig: true,
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
    'js',
    'json',
    'jsx',
    'ts',
    'tsx',
  ],
  preset: 'ts-jest',
  testMatch: null,
};
