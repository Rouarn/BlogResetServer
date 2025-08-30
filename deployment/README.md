# 🚀 NestJS 项目部署指南

本目录包含了 NestJS 项目的完整部署方案，支持 Docker 和 PM2 两种部署方式。

## 📋 环境要求

### 🐳 Docker 部署（推荐）
**服务器需要预装：**
- Docker (20.10+)
- Docker Compose (2.0+)

**安装命令：**
```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 将用户添加到 docker 组
sudo usermod -aG docker $USER
# 重新登录生效
```

### 📦 PM2 部署
**服务器需要预装：**
- Node.js (18.x 或 20.x)
- npm (9.x+)
- PM2 (全局安装)
- MySQL (8.0+) 或 PostgreSQL (13+)

**安装命令：**
```bash
# 安装 Node.js (使用 NodeSource 仓库)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装 MySQL
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

## 📁 目录结构

```
deployment/
├── README.md              # 部署指南（本文件）
├── docker/                # Docker 相关文件
│   ├── Dockerfile         # Docker 镜像构建
│   ├── docker-compose.yml # 服务编排
│   └── .dockerignore      # Docker 忽略文件
├── nginx/                 # Nginx 配置
│   └── nginx.conf         # 反向代理配置
├── scripts/               # 部署脚本
│   ├── quick-deploy.sh    # 🚀 一键部署脚本
│   ├── build.sh          # 构建脚本
│   ├── deploy.sh         # Docker 部署脚本
│   └── init.sql          # 数据库初始化
└── config/                # 配置文件
    ├── .env.production    # 生产环境配置
    ├── ecosystem.config.js # PM2 配置
    ├── health-check.js    # Docker 健康检查
    └── standalone-health.js # 独立健康检查服务
```

## 🚀 一键部署（推荐）

### 第1步：配置环境
```bash
# 复制配置文件到项目根目录
cp deployment/config/.env.production .env

# 编辑配置文件（重要！必须修改）
nano .env
```

**必须修改的配置：**
```bash
# 数据库密码（必须修改）
DATABASE_PASSWORD=your_strong_password_here

# JWT 密钥（必须修改，至少32字符）
NEST_JWT_SECRET=your_very_strong_jwt_secret_at_least_32_characters
```

### 第2步：执行部署
```bash
# 给脚本执行权限
chmod +x deployment/scripts/quick-deploy.sh

# 执行一键部署
./deployment/scripts/quick-deploy.sh

# 按提示选择：
# 1) Docker 部署（推荐，自动安装依赖）
# 2) PM2 部署（需要预装环境）
```

### 第3步：验证部署
```bash
# 访问应用
curl http://localhost:3000

# 查看 API 文档
# http://localhost:3000/api-docs

# 健康检查（Docker 方式）
curl http://localhost:3001/health
```

## 🔧 手动部署流程

### 🐳 Docker 部署详细步骤

1. **检查环境**：
```bash
docker --version
docker-compose --version
```

2. **配置环境**：
```bash
cp deployment/config/.env.production .env
# 编辑 .env 文件修改密码
```

3. **执行部署**：
```bash
cd deployment
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

4. **验证服务**：
```bash
docker-compose ps
docker-compose logs -f app
```

### 📦 PM2 部署详细步骤

1. **检查环境**：
```bash
node --version    # 需要 18.x 或 20.x
npm --version
pm2 --version
mysql --version   # 或 postgresql
```

2. **构建项目**：
```bash
npm ci
npm run build
```

3. **配置数据库**：
```bash
# 创建数据库和用户
mysql -u root -p < deployment/scripts/init.sql
```

4. **启动应用**：
```bash
cp deployment/config/ecosystem.config.js .
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## 📊 运维管理

### 查看服务状态
```bash
# Docker 方式
docker-compose ps
docker-compose logs -f app

# PM2 方式
pm2 status
pm2 logs nestjs-app
pm2 monit
```

### 重启服务
```bash
# Docker 方式
docker-compose restart app

# PM2 方式
pm2 restart nestjs-app
```

### 停止服务
```bash
# Docker 方式
docker-compose down

# PM2 方式
pm2 stop nestjs-app
```

## 🔍 故障排除

### 常见问题

1. **Docker 未安装**：
```bash
# 检查安装
docker --version
# 如果未安装，执行环境要求中的安装命令
```

2. **端口被占用**：
```bash
# 查看端口占用
netstat -tlnp | grep :3000
# 杀死占用进程
sudo kill -9 <PID>
```

3. **数据库连接失败**：
```bash
# 检查数据库服务
sudo systemctl status mysql
# 检查配置
cat .env | grep DATABASE
```

4. **权限问题**：
```bash
# 修复权限
sudo chown -R $USER:$USER .
chmod -R 755 .
```

5. **内存不足**：
```bash
# 检查内存
free -h
# 清理 Docker 资源
docker system prune -a
```

## 🛡️ 安全配置

### 防火墙设置
```bash
# 只开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### SSL 证书配置
```bash
# 使用 Let's Encrypt
sudo apt install certbot
sudo certbot --nginx -d your-domain.com
```

### 定期维护
```bash
# 更新系统
sudo apt update && sudo apt upgrade

# 备份数据库
docker exec nestjs-mysql mysqldump -u nestjs -p nestjs_db > backup-$(date +%Y%m%d).sql

# 清理日志
sudo logrotate -f /etc/logrotate.conf
```

## 🎯 性能优化

### 系统优化
```bash
# 调整文件描述符限制
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf

# 优化内核参数
echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
sysctl -p
```

### 应用优化
- 启用 Redis 缓存
- 配置数据库连接池
- 使用 CDN 加速静态资源
- 启用 Gzip 压缩

## 📞 获取帮助

如果遇到问题：
1. 检查相关日志文件
2. 确认环境要求是否满足
3. 验证配置文件是否正确
4. 参考故障排除章节
5. 联系技术支持团队

---

**快速链接：**
- 🚀 [一键部署脚本](scripts/quick-deploy.sh)
- 🐳 [Docker 配置](docker/)
- ⚙️ [环境配置](config/)
- 📝 [部署脚本](scripts/)