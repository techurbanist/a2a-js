// eslint.config.js
import typescriptEstree from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: {
        ecmaVersion: 2020
      }
    },
    rules: {
      "no-unused-vars": "warn"
    }
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: typescriptEstree,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: "./tsconfig.json"
      }
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-this-alias": "warn"
    }
  },
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"]
  }
];
