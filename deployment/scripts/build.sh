#!/bin/bash

echo "🔨 开始构建生产环境..."

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录执行此脚本"
    exit 1
fi

# 清理旧的构建文件
echo "🧹 清理旧文件..."
rm -rf dist
rm -rf node_modules

# 安装依赖
echo "📦 安装依赖..."
npm ci

# 构建项目
echo "🏗️ 构建项目..."
npm run build

# 创建必要的目录
echo "📁 创建目录..."
mkdir -p uploads logs static

echo "✅ 构建完成！"