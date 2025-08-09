import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/**/*.{js,ts}',
    'app/**/*.{js,ts,tsx}',
    'components/**/*.{js,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      lines: 70,
      branches: 65,
      functions: 70,
      statements: 70,
    },
    './lib/diff.ts': {
      lines: 80,
      branches: 80,
      functions: 85,
      statements: 80,
    },
    './lib/history.ts': {
      lines: 80,
      branches: 80,
      functions: 85,
      statements: 80,
    },
    './lib/tokens/': {
      lines: 80,
      branches: 75,
      functions: 80,
      statements: 80,
    },
  },
};

export default createJestConfig(customJestConfig);