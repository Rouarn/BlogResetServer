#!/bin/bash

set -e

echo "🚀 NestJS 项目一键部署脚本"
echo "================================"

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录执行此脚本"
    exit 1
fi

# 选择部署方式
echo "请选择部署方式："
echo "1) Docker 部署（推荐）"
echo "2) PM2 部署"
read -p "请输入选择 (1 或 2): " choice

case $choice in
    1)
        echo "🐳 选择了 Docker 部署"
        DEPLOY_METHOD="docker"
        ;;
    2)
        echo "📦 选择了 PM2 部署"
        DEPLOY_METHOD="pm2"
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

# 检查环境配置
if [ ! -f ".env" ]; then
    echo "📝 复制环境配置文件..."
    cp deployment/config/.env.production .env
    echo "⚠️  请编辑 .env 文件，修改数据库密码和 JWT 密钥"
    echo "重要配置项："
    echo "- DATABASE_PASSWORD: 数据库密码"
    echo "- NEST_JWT_SECRET: JWT 密钥（至少32字符）"
    read -p "配置完成后按回车继续..."
fi

if [ "$DEPLOY_METHOD" = "docker" ]; then
    # Docker 部署
    echo "🐳 开始 Docker 部署..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    # 进入部署目录
    cd deployment/docker
    
    # 创建必要目录
    mkdir -p ../../uploads ../../logs ../nginx/ssl
    
    # 停止现有服务
    echo "🛑 停止现有服务..."
    docker-compose down 2>/dev/null || true
    
    # 构建并启动
    echo "🏗️ 构建并启动服务..."
    docker-compose up -d --build
    
    # 等待服务启动
    echo "⏳ 等待服务启动..."
    sleep 30
    
    # 健康检查
    echo "🔍 执行健康检查..."
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Docker 部署成功！"
        echo "🌐 应用地址: http://localhost:3000"
        echo "📚 API 文档: http://localhost:3000/api-docs"
        echo "🔍 健康检查: http://localhost:3001/health"
    else
        echo "❌ 健康检查失败，查看日志："
        docker-compose logs app
        exit 1
    fi
    
elif [ "$DEPLOY_METHOD" = "pm2" ]; then
    # PM2 部署
    echo "📦 开始 PM2 部署..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    # 安装依赖
    echo "📦 安装依赖..."
    npm ci
    
    # 构建项目
    echo "🏗️ 构建项目..."
    npm run build
    
    # 检查 PM2
    if ! command -v pm2 &> /dev/null; then
        echo "📦 安装 PM2..."
        npm install -g pm2
    fi
    
    # 复制 PM2 配置
    cp deployment/config/ecosystem.config.js .
    
    # 停止现有进程
    pm2 delete nestjs-app 2>/dev/null || true
    
    # 启动应用
    echo "🚀 启动应用..."
    pm2 start ecosystem.config.js --env production
    
    # 保存配置
    pm2 save
    
    # 健康检查
    echo "⏳ 等待应用启动..."
    sleep 10
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ PM2 部署成功！"
        echo "🌐 应用地址: http://localhost:3000"
        echo "📚 API 文档: http://localhost:3000/api-docs"
        echo "📊 PM2 监控: pm2 monit"
    else
        echo "❌ 应用启动失败，查看日志："
        pm2 logs nestjs-app
        exit 1
    fi
fi

echo ""
echo "🎉 部署完成！"
echo ""
echo "常用命令："
if [ "$DEPLOY_METHOD" = "docker" ]; then
    echo "- 查看日志: cd deployment/docker && docker-compose logs -f app"
    echo "- 重启服务: cd deployment/docker && docker-compose restart app"
    echo "- 停止服务: cd deployment/docker && docker-compose down"
else
    echo "- 查看状态: pm2 status"
    echo "- 查看日志: pm2 logs nestjs-app"
    echo "- 重启应用: pm2 restart nestjs-app"
    echo "- 停止应用: pm2 stop nestjs-app"
fi