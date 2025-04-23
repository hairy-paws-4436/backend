const baseConfig = require('../jest.config');

module.exports = {
  ...baseConfig,
  testRegex: '.*\\.e2e-spec\\.ts$',
  rootDir: '../',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/test/unit/',
    '/test/integration/'
  ],
  testMatch: ['**/test/e2e/**/*.e2e-spec.ts']
};