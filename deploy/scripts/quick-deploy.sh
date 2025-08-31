#!/bin/bash

# =============================================================================
# NestJS 项目一键部署脚本
#
# 功能说明：
# - 提供交互式部署选择（Docker 或 PM2）
# - 自动检查和配置环境
# - 执行完整的部署流程
# - 提供部署后的管理命令指导
#
# 支持的部署方式：
# 1. Docker 部署（推荐）
#    - 容器化部署，环境隔离
#    - 包含数据库、缓存、反向代理
#    - 适合生产环境
#
# 2. PM2 部署
#    - 进程管理器部署
#    - 需要手动配置数据库
#    - 适合简单部署场景
#
# 使用方法：
# ./deploy/scripts/quick-deploy.sh
# =============================================================================

# 遇到任何错误立即退出脚本
set -e

echo "🚀 NestJS 项目一键部署脚本"
echo "================================"

# -----------------------------------------------------------------------------
# 环境检查阶段
# 确保在正确的目录执行部署
# -----------------------------------------------------------------------------

# 检查是否在项目根目录
# 通过检查 package.json 文件确认目录位置
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录执行此脚本"
    echo "   正确路径：./deploy/scripts/quick-deploy.sh"
    exit 1
fi

# -----------------------------------------------------------------------------
# 部署方式选择阶段
# 让用户选择适合的部署方式
# -----------------------------------------------------------------------------

echo "请选择部署方式："
echo "1) Docker 部署（推荐）"
echo "   - 完整的容器化解决方案"
echo "   - 包含数据库、缓存、反向代理"
echo "   - 环境隔离，易于管理"
echo ""
echo "2) PM2 部署"
echo "   - 轻量级进程管理"
echo "   - 需要手动配置数据库"
echo "   - 适合简单部署场景"
echo ""
read -p "请输入选择 (1 或 2): " choice

# 根据用户选择设置部署方法
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
        echo "❌ 无效选择，请输入 1 或 2"
        exit 1
        ;;
esac

# -----------------------------------------------------------------------------
# 环境配置检查阶段
# 确保环境变量文件存在并提醒用户配置
# -----------------------------------------------------------------------------

# 检查 .env 文件是否存在
if [ ! -f ".env" ]; then
    echo "📝 复制环境配置文件..."
    # 从模板复制环境配置文件
    cp deploy/config/.env.production .env

    echo ""
    echo "⚠️  重要：请编辑 .env 文件，修改以下配置项："
    echo ""
    echo "🔐 安全配置（必须修改）："
    echo "- DATABASE_PASSWORD: 数据库密码（建议使用强密码）"
    echo "- NEST_JWT_SECRET: JWT 密钥（至少32字符的随机字符串）"
    echo ""
    echo "🔧 可选配置："
    echo "- DATABASE_HOST: 数据库主机地址"
    echo "- REDIS_HOST: Redis 主机地址"
    echo "- PORT: 应用端口（默认3000）"
    echo ""
    echo "💡 提示：可以使用以下命令生成安全的密钥："
    echo "   openssl rand -base64 32"
    echo ""
    read -p "配置完成后按回车继续..."
fi

# -----------------------------------------------------------------------------
# Docker 部署流程
# 使用 Docker Compose 编排多服务部署
# -----------------------------------------------------------------------------

if [ "$DEPLOY_METHOD" = "docker" ]; then
    echo "🐳 开始 Docker 部署..."

    # 检查 Docker 是否安装
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker 未安装，请先安装 Docker"
        echo "   安装指南：https://docs.docker.com/get-docker/"
        exit 1
    fi

    # 检查 Docker Compose 是否安装
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
        echo "   安装指南：https://docs.docker.com/compose/install/"
        exit 1
    fi

    # 进入 Docker 配置目录
    cd deploy/docker

    # 创建必要的目录
    echo "📁 创建必要目录..."
    mkdir -p ../../uploads ../../logs ../nginx/ssl

    # 停止现有服务（如果存在）
    echo "🛑 停止现有服务..."
    # 使用 2>/dev/null || true 忽略错误（如果服务不存在）
    docker-compose down 2>/dev/null || true

    # 构建并启动所有服务
    echo "🏗️ 构建并启动服务..."
    # --build: 强制重新构建镜像
    # -d: 后台运行
    docker-compose up -d --build

    # 等待服务完全启动
    echo "⏳ 等待服务启动..."
    echo "   正在启动：NestJS 应用、MySQL、Redis、Nginx..."
    sleep 30

    # 执行健康检查验证部署
    echo "🔍 执行健康检查..."
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Docker 部署成功！"
        echo ""
        echo "📋 服务访问地址："
        echo "🌐 应用地址: http://localhost:3000"
        echo "📚 API 文档: http://localhost:3000/api-docs"
        echo "🔍 健康检查: http://localhost:3001/health"
    else
        echo "❌ 健康检查失败，查看应用日志："
        docker-compose logs app
        exit 1
    fi

# -----------------------------------------------------------------------------
# PM2 部署流程
# 使用 PM2 进程管理器部署单应用
# -----------------------------------------------------------------------------

elif [ "$DEPLOY_METHOD" = "pm2" ]; then
    echo "📦 开始 PM2 部署..."

    # 检查 Node.js 是否安装
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装，请先安装 Node.js"
        echo "   推荐版本：Node.js 18 LTS"
        echo "   下载地址：https://nodejs.org/"
        exit 1
    fi

    # 安装项目依赖
    echo "📦 安装依赖..."
    npm ci

    # 构建 TypeScript 项目
    echo "🏗️ 构建项目..."
    npm run build

    # 检查 PM2 是否安装，如果没有则安装
    if ! command -v pm2 &> /dev/null; then
        echo "📦 安装 PM2..."
        npm install -g pm2
    fi

    # 复制 PM2 配置文件到项目根目录
    echo "📋 配置 PM2..."
    cp deploy/config/ecosystem.config.js .

    # 停止现有的应用进程（如果存在）
    echo "🛑 停止现有进程..."
    # 使用 2>/dev/null || true 忽略错误（如果进程不存在）
    pm2 delete nestjs-app 2>/dev/null || true

    # 启动应用
    echo "🚀 启动应用..."
    pm2 start ecosystem.config.js --env production

    # 保存 PM2 配置，系统重启后自动恢复
    pm2 save

    # 等待应用启动
    echo "⏳ 等待应用启动..."
    sleep 10

    # 执行健康检查
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ PM2 部署成功！"
        echo ""
        echo "📋 服务访问地址："
        echo "🌐 应用地址: http://localhost:3000"
        echo "📚 API 文档: http://localhost:3000/api-docs"
        echo "📊 PM2 监控: pm2 monit"
    else
        echo "❌ 应用启动失败，查看应用日志："
        pm2 logs nestjs-app
        exit 1
    fi
fi

# -----------------------------------------------------------------------------
# 部署完成提示
# 提供后续管理和维护的常用命令
# -----------------------------------------------------------------------------

echo ""
echo "🎉 部署完成！"
echo ""
echo "📚 常用管理命令："

if [ "$DEPLOY_METHOD" = "docker" ]; then
    echo ""
    echo "🐳 Docker 管理命令："
    echo "- 查看服务状态: cd deploy/docker && docker-compose ps"
    echo "- 查看应用日志: cd deploy/docker && docker-compose logs -f app"
    echo "- 查看所有日志: cd deploy/docker && docker-compose logs -f"
    echo "- 重启应用: cd deploy/docker && docker-compose restart app"
    echo "- 重启所有服务: cd deploy/docker && docker-compose restart"
    echo "- 停止所有服务: cd deploy/docker && docker-compose down"
    echo "- 更新部署: cd deploy/docker && docker-compose up -d --build"
else
    echo ""
    echo "📦 PM2 管理命令："
    echo "- 查看进程状态: pm2 status"
    echo "- 查看应用日志: pm2 logs nestjs-app"
    echo "- 实时监控: pm2 monit"
    echo "- 重启应用: pm2 restart nestjs-app"
    echo "- 停止应用: pm2 stop nestjs-app"
    echo "- 删除应用: pm2 delete nestjs-app"
    echo "- 查看详细信息: pm2 show nestjs-app"
fi

echo ""
echo "🔧 故障排除："
echo "- 检查端口占用: netstat -tlnp | grep :3000"
echo "- 检查防火墙设置"
echo "- 确认 .env 文件配置正确"
echo ""
echo "📖 更多帮助请查看项目文档"
