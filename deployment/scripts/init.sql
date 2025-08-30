-- =============================================================================
-- MySQL 数据库初始化脚本
-- 
-- 功能说明：
-- - 创建 NestJS 应用所需的数据库
-- - 创建专用数据库用户
-- - 设置正确的权限和字符集
-- - 为 Docker 容器初始化提供支持
-- 
-- 使用场景：
-- - Docker 容器首次启动时自动执行
-- - 手动初始化数据库环境
-- - 开发环境数据库设置
-- 
-- 注意事项：
-- - 此脚本会在 MySQL 容器启动时自动执行
-- - 密码需要与 docker-compose.yml 中的环境变量一致
-- - 使用 utf8mb4 字符集支持完整的 Unicode 字符
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 数据库创建
-- 创建 NestJS 应用的主数据库
-- -----------------------------------------------------------------------------

-- 创建数据库（如果不存在）
-- CHARACTER SET utf8mb4: 使用 UTF-8 的完整实现，支持 4 字节字符（如 emoji）
-- COLLATE utf8mb4_unicode_ci: 使用 Unicode 排序规则，不区分大小写
CREATE DATABASE IF NOT EXISTS nestjs_db 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- 切换到新创建的数据库
USE nestjs_db;

-- -----------------------------------------------------------------------------
-- 用户管理
-- 创建专用的数据库用户，遵循最小权限原则
-- -----------------------------------------------------------------------------

-- 创建应用专用用户（如果不存在）
-- 'nestjs'@'%': 用户名为 nestjs，允许从任何主机连接（% 通配符）
-- IDENTIFIED BY: 设置用户密码（实际密码由环境变量提供）
-- 注意：在生产环境中，密码应该通过环境变量传入，而不是硬编码
CREATE USER IF NOT EXISTS 'nestjs'@'%' IDENTIFIED BY 'your_password_here';

-- -----------------------------------------------------------------------------
-- 权限设置
-- 为应用用户分配必要的数据库权限
-- -----------------------------------------------------------------------------

-- 授予用户对 nestjs_db 数据库的所有权限
-- ALL PRIVILEGES: 包括 SELECT, INSERT, UPDATE, DELETE, CREATE, DROP 等
-- ON nestjs_db.*: 权限范围限制在 nestjs_db 数据库的所有表
-- TO 'nestjs'@'%': 授权给 nestjs 用户
GRANT ALL PRIVILEGES ON nestjs_db.* TO 'nestjs'@'%';

-- 刷新权限表，使权限更改立即生效
FLUSH PRIVILEGES;

-- -----------------------------------------------------------------------------
-- 可选：初始化数据和表结构
-- 
-- 注意：通常不需要手动创建表结构，因为：
-- 1. TypeORM 可以自动创建和同步表结构
-- 2. 应用启动时会根据实体定义自动创建表
-- 3. 数据库迁移脚本会处理表结构变更
-- -----------------------------------------------------------------------------

-- 示例：创建系统配置表（可选）
-- CREATE TABLE IF NOT EXISTS system_config (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     config_key VARCHAR(100) NOT NULL UNIQUE,
--     config_value TEXT,
--     description VARCHAR(255),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 示例：插入初始配置数据（可选）
-- INSERT IGNORE INTO system_config (config_key, config_value, description) VALUES
-- ('app_name', 'NestJS Template', '应用名称'),
-- ('app_version', '1.0.0', '应用版本'),
-- ('maintenance_mode', 'false', '维护模式开关');

-- 示例：创建索引（可选）
-- 如果有特定的查询需求，可以在这里创建索引
-- CREATE INDEX idx_created_at ON some_table(created_at);

-- -----------------------------------------------------------------------------
-- 数据库优化设置（可选）
-- 根据应用需求调整数据库参数
-- -----------------------------------------------------------------------------

-- 注意：以下设置通常在 MySQL 配置文件中设置，这里仅作示例
-- SET GLOBAL innodb_buffer_pool_size = 128M;  -- 设置 InnoDB 缓冲池大小
-- SET GLOBAL max_connections = 200;           -- 设置最大连接数

-- -----------------------------------------------------------------------------
-- 完成提示
-- -----------------------------------------------------------------------------

-- 输出初始化完成信息（仅在手动执行时可见）
SELECT 'Database initialization completed successfully!' AS status;
SELECT 'Database: nestjs_db' AS info;
SELECT 'User: nestjs' AS info;
SELECT 'Character Set: utf8mb4' AS info;
SELECT 'Collation: utf8mb4_unicode_ci' AS info;