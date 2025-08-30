#!/bin/bash

set -e

echo "🚀 开始部署到生产环境..."

# 检查是否在 deployment 目录
if [ ! -f "docker/docker-compose.yml" ]; then
    echo "❌ 请在 deployment 目录执行此脚本"
    exit 1
fi

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f "../.env" ]; then
    echo "❌ 未找到 .env 文件，请先复制 config/.env.production 到项目根目录"
    exit 1
fi

# 进入 docker 目录
cd docker

# 创建必要的目录
echo "📁 创建必要目录..."
mkdir -p ../../uploads ../../logs ../nginx/ssl

# 设置权限
chmod 755 ../../uploads ../../logs

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose down

# 构建并启动服务
echo "🏗️ 构建并启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 健康检查
echo "🔍 执行健康检查..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ 部署成功！服务正在运行"
    echo "🌐 API地址: http://localhost:3000"
    echo "📚 API文档: http://localhost:3000/api-docs"
    echo "🔍 健康检查: http://localhost:3001/health"
else
    echo "❌ 健康检查失败，请检查日志"
    docker-compose logs app
    exit 1
fi

echo "🎉 部署完成！"