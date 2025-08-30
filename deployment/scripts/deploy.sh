#!/bin/bash

# =============================================================================
# 生产环境部署脚本
# 
# 功能说明：
# - 自动化部署 NestJS 应用到生产环境
# - 使用 Docker Compose 编排多个服务
# - 执行环境检查和健康检查
# - 提供部署状态反馈
# 
# 使用方法：
# 1. 确保在 deployment 目录下执行
# 2. 确保已配置 .env 文件
# 3. 运行：./scripts/deploy.sh
# 
# 部署流程：
# 1. 环境检查（Docker、文件等）
# 2. 创建必要目录和权限设置
# 3. 停止现有服务
# 4. 构建并启动新服务
# 5. 健康检查验证
# =============================================================================

# 遇到任何错误立即退出脚本
set -e

echo "🚀 开始部署到生产环境..."

# -----------------------------------------------------------------------------
# 环境检查阶段
# 验证运行环境和必要文件是否就绪
# -----------------------------------------------------------------------------

# 检查是否在正确的目录执行脚本
# 通过检查 docker-compose.yml 文件确认目录位置
if [ ! -f "docker/docker-compose.yml" ]; then
    echo "❌ 请在 deployment 目录执行此脚本"
    echo "   正确路径：cd deployment && ./scripts/deploy.sh"
    exit 1
fi

# 检查 Docker 是否已安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    echo "   安装指南：https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查 Docker Compose 是否已安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    echo "   安装指南：https://docs.docker.com/compose/install/"
    exit 1
fi

# 检查环境变量配置文件是否存在
# .env 文件包含数据库密码、JWT 密钥等敏感信息
if [ ! -f "../.env" ]; then
    echo "❌ 未找到 .env 文件，请先复制 config/.env.production 到项目根目录"
    echo "   执行：cp config/.env.production ../.env"
    echo "   然后编辑 .env 文件，设置正确的密码和密钥"
    exit 1
fi

# 进入 docker 目录（docker-compose.yml 所在目录）
cd docker

# -----------------------------------------------------------------------------
# 目录和权限设置阶段
# 创建应用运行所需的目录并设置正确权限
# -----------------------------------------------------------------------------

echo "📁 创建必要目录..."

# 创建目录：
# - uploads: 文件上传存储目录
# - logs: 应用日志存储目录  
# - ssl: SSL 证书存储目录（用于 HTTPS）
mkdir -p ../../uploads ../../logs ../nginx/ssl

# 设置目录权限为 755（所有者可读写执行，其他用户可读执行）
# 确保 Docker 容器内的应用可以正常读写这些目录
chmod 755 ../../uploads ../../logs

# -----------------------------------------------------------------------------
# 服务管理阶段
# 停止现有服务并启动新服务
# -----------------------------------------------------------------------------

echo "🛑 停止现有服务..."
# 优雅停止所有相关的 Docker 容器和网络
# 不会删除数据卷，保证数据持久化
docker-compose down

echo "🏗️ 构建并启动服务..."
# 重新构建镜像并启动所有服务
# -d: 后台运行（守护进程模式）
# --build: 强制重新构建镜像（确保使用最新代码）
docker-compose up -d --build

# -----------------------------------------------------------------------------
# 服务启动等待阶段
# 等待所有服务完全启动并就绪
# -----------------------------------------------------------------------------

echo "⏳ 等待服务启动..."
# 等待 30 秒让所有服务完全启动
# 包括数据库初始化、应用启动、健康检查服务启动等
sleep 30

# -----------------------------------------------------------------------------
# 健康检查阶段
# 验证部署是否成功，服务是否正常运行
# -----------------------------------------------------------------------------

echo "🔍 执行健康检查..."

# 向健康检查服务发送请求验证应用状态
# -f: 如果 HTTP 状态码表示失败则 curl 返回非零退出码
# > /dev/null 2>&1: 隐藏输出，只关心退出码
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    # 健康检查通过，显示成功信息和访问地址
    echo "✅ 部署成功！服务正在运行"
    echo ""
    echo "📋 服务访问地址："
    echo "🌐 API地址: http://localhost:3000"
    echo "📚 API文档: http://localhost:3000/api-docs"
    echo "🔍 健康检查: http://localhost:3001/health"
    echo ""
    echo "📊 查看服务状态: docker-compose ps"
    echo "📝 查看日志: docker-compose logs -f [service_name]"
else
    # 健康检查失败，显示错误信息和日志
    echo "❌ 健康检查失败，请检查日志"
    echo ""
    echo "📝 应用日志："
    docker-compose logs app
    echo ""
    echo "🔧 故障排除："
    echo "   1. 检查 .env 文件配置是否正确"
    echo "   2. 检查端口是否被占用：netstat -tlnp | grep :3000"
    echo "   3. 查看所有服务状态：docker-compose ps"
    echo "   4. 查看详细日志：docker-compose logs -f"
    exit 1
fi

echo "🎉 部署完成！"