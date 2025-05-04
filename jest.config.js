/** @type {import('jest').Config} */
export default {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.{js,ts}'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],
};
