module.exports = {
  testEnvironment: 'node',
  maxWorkers: 1,
  transform: {
    '^.+\\.ts$': 'babel-jest',
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/helper.ts',
    '!src/invoiceValidation.ts',
    '!src/errors.ts',
    '!src/types.ts',
  ],
}