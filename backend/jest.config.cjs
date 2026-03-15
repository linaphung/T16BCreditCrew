module.exports = {
  testEnvironment: 'node',
  maxWorkers: 1,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
  ],
}