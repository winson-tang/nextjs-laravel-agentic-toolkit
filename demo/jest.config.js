/**
 * Jest config for the demo.
 * Uses ts-jest for TS support. Excludes e2e tests (handled by Playwright).
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/unit/**/*.test.ts", "<rootDir>/tests/integration/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/tests/e2e/"],
  testTimeout: 5000,
  randomize: true, // surface order dependencies
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};
