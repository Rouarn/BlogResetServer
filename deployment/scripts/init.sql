-- MySQL 数据库初始化脚本

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS nestjs_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE nestjs_db;

-- 创建用户（如果不存在）
CREATE USER IF NOT EXISTS 'nestjs'@'%' IDENTIFIED BY 'your_password_here';

-- 授权
GRANT ALL PRIVILEGES ON nestjs_db.* TO 'nestjs'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 创建基础表结构（可选，TypeORM 会自动创建）
-- 这里可以添加一些初始化数据或索引