# =============================================================================
# NestJS 应用 Docker 镜像构建文件
#
# 采用多阶段构建策略，优化镜像大小和安全性：
# 1. 构建阶段：编译 TypeScript 代码
# 2. 生产阶段：运行编译后的应用
#
# 安全特性：
# - 使用非 root 用户运行应用
# - 最小化镜像体积（Alpine Linux）
# - 信号处理优化（dumb-init）
# - 健康检查机制
# =============================================================================

# -----------------------------------------------------------------------------
# 第一阶段：构建阶段
# 用于编译 TypeScript 代码和安装构建依赖
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
# 先复制依赖文件，利用 Docker 缓存层优化构建速度
COPY package*.json ./

# 安装所有依赖（包括开发依赖，用于构建）
# 使用 npm ci 确保依赖版本一致性
RUN npm ci

# 复制源代码到容器
COPY . .

# 构建应用（TypeScript 编译）
RUN npm run build

# -----------------------------------------------------------------------------
# 第二阶段：生产阶段
# 运行编译后的应用，不包含开发依赖和源代码
# -----------------------------------------------------------------------------
FROM node:18-alpine AS production

# 安装 dumb-init 用于正确处理信号（SIGTERM、SIGINT）
# 确保容器能够优雅关闭
RUN apk add --no-cache dumb-init

# 创建非 root 用户组和用户（安全最佳实践）
# GID 1001: nodejs 用户组
# UID 1001: nestjs 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 只安装生产依赖，减少镜像大小
# 清理 npm 缓存释放空间
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制编译后的代码
# 设置正确的文件所有者为 nestjs 用户
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# 复制健康检查脚本到容器根目录
COPY --from=builder --chown=nestjs:nodejs /app/deploy/config/health-check.js ./
COPY --from=builder --chown=nestjs:nodejs /app/deploy/config/standalone-health.js ./

# 创建文件上传目录并设置权限
# 确保应用有权限写入上传的文件
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

# 切换到非 root 用户运行应用（安全最佳实践）
USER nestjs

# 暴露应用端口
# 注意：这只是声明，实际端口映射在运行时指定
EXPOSE 3000

# 配置健康检查
# --interval=30s  : 每30秒检查一次
# --timeout=3s    : 单次检查超时时间3秒
# --start-period=5s : 容器启动后5秒开始检查
# --retries=3     : 连续失败3次后标记为不健康
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node health-check.js || exit 1

# 启动应用
# 使用 dumb-init 作为 PID 1 进程，正确处理信号和僵尸进程
CMD ["dumb-init", "node", "dist/main"]
