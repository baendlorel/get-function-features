export default {
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,ts}'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],
};
