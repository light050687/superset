/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: false,
    }],
  },
  // Mock Superset packages — не установлены в dev-зависимостях плагина (peer).
  moduleNameMapper: {
    '^@superset-ui/core$': '<rootDir>/test/__mocks__/@superset-ui/core.ts',
    '^@superset-ui/core/components$': '<rootDir>/test/__mocks__/@superset-ui/core.ts',
    '^@superset-ui/chart-controls$': '<rootDir>/test/__mocks__/@superset-ui/chart-controls.ts',
  },
};
