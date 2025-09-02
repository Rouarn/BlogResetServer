/**
 * ESLint 配置文件 - NestJS 项目优化版
 *
 * @description
 * 针对 NestJS 框架优化的代码质量检查规则
 * 支持装饰器、依赖注入、模块化架构等 NestJS 特性
 * 集成 TypeScript 和 Prettier 支持
 *
 * NestJS 特性支持:
 * - 装饰器语法 (@Injectable, @Controller, @Get 等)
 * - 依赖注入模式
 * - 模块化架构
 * - 类验证和转换
 * - 异步编程模式
 *
 * 使用方式:
 * ```bash
 * # 检查代码质量
 * pnpm run lint
 *
 * # 自动修复可修复的问题
 * pnpm run lint:fix
 *
 * # 检查特定文件
 * npx eslint src/**//*.ts
 * ```
 *
 * @author NestJS Template Team
 * @since 1.0.0
 */

module.exports = {
  // TypeScript 解析器配置
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    ecmaVersion: 2021,
  },

  // ESLint 插件配置
  plugins: ['@typescript-eslint/eslint-plugin', 'import'],

  // 继承的配置规则集
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],

  // 标记为根配置文件
  root: true,

  // 运行环境配置
  env: {
    node: true,
    jest: true,
    es2021: true,
  },

  // 忽略检查的文件模式
  ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/', 'scripts/'],

  // 自定义规则配置 - NestJS 优化
  rules: {
    // ========== TypeScript 规则 ==========

    // 关闭接口名称前缀检查 (NestJS 不要求 I 前缀)
    '@typescript-eslint/interface-name-prefix': 'off',

    // 要求显式函数返回类型 (NestJS 控制器方法推荐)
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
      },
    ],

    // 要求模块边界显式类型 (NestJS 服务和控制器推荐)
    '@typescript-eslint/explicit-module-boundary-types': 'warn',

    // 限制 any 类型使用 (提高类型安全)
    '@typescript-eslint/no-explicit-any': 'warn',

    // 强制使用一致的类型导入语法 (排除装饰器和运行时需要的导入)
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        disallowTypeAnnotations: true,
        fixStyle: 'separate-type-imports',
      },
    ],

    // 强制类型导入，但排除装饰器和运行时需要的导入
    '@typescript-eslint/no-import-type-side-effects': 'error',

    // 禁止未使用的变量 (排除以 _ 开头的变量)
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],

    // 要求 Promise 正确处理 (NestJS 异步操作)
    '@typescript-eslint/no-floating-promises': 'error',

    // 禁止不安全的成员访问
    '@typescript-eslint/no-unsafe-member-access': 'warn',

    // 禁止不安全的返回
    '@typescript-eslint/no-unsafe-return': 'warn',

    // ========== 导入规则 ==========

    // 导入排序由 Prettier 处理

    // 禁止重复导入
    'import/no-duplicates': 'error',

    // 禁止未解析的导入
    'import/no-unresolved': 'off', // TypeScript 处理

    // ========== NestJS 特定规则 ==========

    // 允许空构造函数 (NestJS 依赖注入)
    '@typescript-eslint/no-useless-constructor': 'off',

    // 允许参数属性 (NestJS 构造函数注入)
    '@typescript-eslint/parameter-properties': 'off',

    // 装饰器相关
    '@typescript-eslint/no-inferrable-types': 'off',

    // ========== 代码质量规则 ==========

    // 要求使用 const 断言
    '@typescript-eslint/prefer-as-const': 'error',

    // 优先使用可选链
    '@typescript-eslint/prefer-optional-chain': 'error',

    // 优先使用空值合并
    '@typescript-eslint/prefer-nullish-coalescing': 'error',

    // 禁止不必要的类型断言
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',

    // 要求数组类型使用 T[] 语法
    '@typescript-eslint/array-type': ['error', { default: 'array' }],

    // 统一布尔表达式
    '@typescript-eslint/prefer-literal-enum-member': 'error',
  },

  // 设置解析器选项
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
