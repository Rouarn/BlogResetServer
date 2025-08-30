/**
 * ESLint 配置文件
 * 
 * @description
 * 定义项目的代码质量检查规则和标准
 * 集成 TypeScript 和 Prettier 支持
 * 确保代码风格一致性和质量
 * 
 * 主要功能:
 * - TypeScript 语法检查和类型验证
 * - 代码风格统一和格式化
 * - 潜在错误和问题检测
 * - 最佳实践规则强制执行
 * - 与 Prettier 集成避免冲突
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
 * npx eslint src/app.module.ts
 * ```
 * 
 * 配置说明:
 * - parser: 使用 TypeScript 解析器
 * - plugins: 启用 TypeScript ESLint 插件
 * - extends: 继承推荐配置和 Prettier 集成
 * - rules: 自定义规则覆盖
 * 
 * @author NestJS Template Team
 * @since 1.0.0
 */

module.exports = {
  // TypeScript 解析器配置
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',        // TypeScript 配置文件路径
    tsconfigRootDir: __dirname,      // 配置文件根目录
    sourceType: 'module',            // 使用 ES6 模块语法
  },

  // ESLint 插件配置
  plugins: ['@typescript-eslint/eslint-plugin'],

  // 继承的配置规则集
  extends: [
    'plugin:@typescript-eslint/recommended',  // TypeScript 推荐规则
    'plugin:prettier/recommended',            // Prettier 集成配置
  ],

  // 标记为根配置文件
  root: true,

  // 运行环境配置
  env: {
    node: true,    // Node.js 全局变量
    jest: true,    // Jest 测试框架全局变量
  },

  // 忽略检查的文件模式
  ignorePatterns: ['.eslintrc.js'],

  // 自定义规则配置
  rules: {
    // 关闭接口名称前缀检查 (允许不以 I 开头的接口名)
    '@typescript-eslint/interface-name-prefix': 'off',
    
    // 关闭显式函数返回类型要求 (TypeScript 可以推断)
    '@typescript-eslint/explicit-function-return-type': 'off',
    
    // 关闭模块边界显式类型要求
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    
    // 允许使用 any 类型 (在某些场景下必要)
    '@typescript-eslint/no-explicit-any': 'off',
    
    // 强制使用一致的类型导入语法
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',           // 优先使用 type import
        disallowTypeAnnotations: true,   // 禁止在类型注解中使用
      },
    ],
  },
};
