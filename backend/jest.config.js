export default {
  preset: "ts-jest",
  testEnvironment: "node",
  maxWorkers: 1,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts"
  ]
};