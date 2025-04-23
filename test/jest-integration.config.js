const baseConfig = require('../jest.config');

module.exports = {
  ...baseConfig,
  testRegex: '.*\\.spec\\.ts$',
  rootDir: '../',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/test/unit/',
    '/test/e2e/'
  ],
  testMatch: ['**/test/integration/**/*.spec.ts']
};