const baseConfig = require('../jest.config');

module.exports = {
  ...baseConfig,
  testRegex: '.*\\.spec\\.ts$',
  rootDir: '../',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/test/integration/',
    '/test/e2e/'
  ],
  testMatch: ['**/test/unit/**/*.spec.ts']
};