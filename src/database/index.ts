/**
 * 数据库模块统一导出
 *
 * @description
 * 导出数据库模块的所有核心服务、配置、实体基类和命名策略。
 * 外部模块应通过此入口文件引用数据库相关功能，而不是直接引用内部文件。
 */
export * from './database.config';
export * from './database.entity';
export * from './database.module';
export * from './database.service';
export * from './naming.strategy';
