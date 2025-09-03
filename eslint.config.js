/**
 * ESLint 配置文件 - NestJS 项目优化版 (ESLint v9+ 扁平配置)
 *
 * @description
 * 针对 NestJS 框架优化的代码质量检查规则
 * 支持装饰器、依赖注入、模块化架构等 NestJS 特性
 * 集成 TypeScript 和 Prettier 支持
 *
 * @author NestJS Template Team
 * @since 1.0.0
 */

const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
  // 忽略文件配置
  {
    ignores: [
      '.eslintrc.js',
      'eslint.config.js',
      'dist/**',
      'node_modules/**',
      'scripts/**',
      '**/*.d.ts',
    ],
  },
  
  // 基础配置
  {
    files: ['src/**/*.ts', 'apps/**/*.ts', 'libs/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
        ecmaVersion: 2021,
      },
      globals: {
        Buffer: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'import': importPlugin,
      'prettier': prettierPlugin,
    },
    rules: {
      // TypeScript 规则
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: true,
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          caughtErrors: 'none',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      
      // Import 规则（简化版）
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'off',
      
      // NestJS 特定规则优化
      '@typescript-eslint/no-useless-constructor': 'off',
      '@typescript-eslint/parameter-properties': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      
      // 基础规则
      'no-unused-vars': 'off', // 使用 TypeScript 版本
      'no-undef': 'off', // TypeScript 处理
      'no-useless-escape': 'warn',
      
      // 代码质量规则
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
      '@typescript-eslint/prefer-literal-enum-member': 'error',
      
      // Prettier 集成
      'prettier/prettier': 'error',
    },
    // settings 移除以避免依赖问题
  },
];
