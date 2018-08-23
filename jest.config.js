module.exports = {
  verbose: true,
  "globals": {
    "ts-jest": {
      "tsConfigFile": "tsconfig.jest.json",
      "useBabelrc": true
    }
  },
  "moduleNameMapper": {
    // 'app/core/utils/datemath': '<rootDir>/node_modules/grafana-sdk-mocks/app/core/utils/datemath.ts',
    // 'app/core/utils/kbn': '<rootDir>/src/__mocks__/kbn.ts',
    'app/plugins/sdk': '<rootDir>/node_modules/grafana-sdk-mocks/app/plugins/sdk.ts',
  },
  "transformIgnorePatterns": [
    "node_modules/(?!(grafana-sdk-mocks))"
  ],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "testRegex": "(\\.|/)([jt]est)\\.ts$",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json"
  ]
};
