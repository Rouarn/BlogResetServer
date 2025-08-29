# 我与夏季 Ra 系统 - 服务端

基于 NestJS 构建的现代化后端API系统，使用 TypeScript 开发，支持JWT认证、数据库ORM、API文档等功能。

## 🚀 项目特性

- ✅ **现代化架构**: 基于 NestJS 框架，采用模块化设计
- ✅ **类型安全**: 完全使用 TypeScript 开发
- ✅ **数据库支持**: 集成 TypeORM，支持 MySQL
- ✅ **身份认证**: JWT + Passport 认证体系
- ✅ **文件管理**: 完整的文件上传下载系统，支持分块上传、断点续传
- ✅ **多协议支持**: HTTP、FTP等多种文件传输协议
- ✅ **存储适配器**: 本地存储、FTP、云存储等多种存储方案
- ✅ **API文档**: 集成 Swagger 自动生成文档
- ✅ **验证码系统**: SVG验证码，防爬虫机制
- ✅ **环境配置**: 完善的环境变量管理
- ✅ **代码质量**: ESLint + Prettier 代码规范
- ✅ **测试支持**: Jest 单元测试和E2E测试

## 📋 技术栈

- **框架**: NestJS 10.x
- **语言**: TypeScript 5.x
- **数据库**: MySQL + TypeORM
- **认证**: JWT + Passport
- **文档**: Swagger/OpenAPI
- **包管理**: PNPM
- **代码规范**: ESLint + Prettier
- **测试**: Jest

## 🛠️ 环境要求

- Node.js >= 18.0.0
- PNPM >= 8.0.0
- MySQL >= 8.0

## 📦 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd nestjs-template
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 环境配置
使用我们提供的环境配置工具快速设置：

```bash
# 交互式配置环境变量
pnpm run env:setup

# 验证环境配置
pnpm run env:check
```

或者手动创建环境文件：
```bash
cp .env.example .env.development
# 编辑 .env.development 文件，填入正确的配置
```

### 4. 数据库准备
确保 MySQL 服务已启动，并创建对应的数据库：
```sql
CREATE DATABASE dbtest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. 启动开发服务器
```bash
pnpm run start:dev
```

服务启动后访问：
- **API服务**: http://localhost:8848
- **API文档**: http://localhost:8848/api-docs

## 📜 Scripts 脚本说明

### 🔧 开发相关
```bash
# 启动开发服务器（带热重载）
pnpm run start:dev

# 启动调试模式
pnpm run start:debug

# 普通启动
pnpm run start
```

### 🏗️ 构建相关
```bash
# 构建项目
pnpm run build

# 生产环境启动
pnpm run start:prod
```

### 🧪 测试相关
```bash
# 运行单元测试
pnpm run test

# 监听模式运行测试
pnpm run test:watch

# 生成测试覆盖率报告
pnpm run test:cov

# 运行E2E测试
pnpm run test:e2e

# 调试测试
pnpm run test:debug
```

### 📋 代码质量
```bash
# 代码格式化
pnpm run format

# 代码检查和修复
pnpm run lint
```

### 🔧 环境配置工具

项目提供了专业的环境配置管理工具，简化开发环境搭建：

```bash
# 环境配置检查工具
pnpm run env:check

# 交互式环境配置向导
pnpm run env:setup
```

#### 环境检查工具 (`pnpm run env:check`)

**功能特性**:
- ✅ 检查必需的环境文件是否存在
- ✅ 验证必需的环境变量是否已设置
- ✅ 检查变量冲突和重复定义
- ✅ 显示端口配置信息
- ✅ 彩色输出，易于阅读

**输出示例**:
```
🔍 NestJS 环境配置检查工具
==================================================

📁 环境文件检查:
  ✅ .env
  ✅ .env.development
  ✅ .env.production
  ✅ .env.example

📋 必需变量检查 (.env.development):
  ✅ NEST_DATABASE_HOST: 127.0.0.1
  ✅ NEST_DATABASE_PORT: 3306
  ✅ NEST_DATABASE_USER: root
  ✅ NEST_DATABASE_PASSWORD: ***
  ✅ NEST_DATABASE_NAME: dbtest
  ✅ NEST_JWT_SECRET: ***
  ✅ NEST_PORT: 8848

🌐 端口配置:
  📍 开发端口: 8848
  📍 生产端口: 3000

==================================================
🎉 环境配置检查通过！
```

#### 环境设置工具 (`pnpm run env:setup`)

**功能特性**:
- 🚀 交互式配置向导
- 🔑 自动生成安全的JWT密钥
- 📁 创建所有必需的环境文件
- ⚠️ 智能检测现有文件并询问是否覆盖
- 📋 提供配置完成后的操作指南

**配置流程**:
1. 检查现有环境文件
2. 配置开发环境数据库信息
3. 配置生产环境数据库信息
4. 设置JWT密钥（可选择自动生成）
5. 创建所有环境文件

**使用示例**:
```bash
# 首次配置项目环境
pnpm run env:setup

# 验证配置是否正确
pnpm run env:check

# 启动开发服务器
pnpm run start:dev
```

#### 环境文件说明

- **`.env`**: 公共配置（JWT密钥等通用配置）
- **`.env.development`**: 开发环境配置（数据库、端口等）
- **`.env.production`**: 生产环境配置（生产数据库、端口等）
- **`.env.example`**: 示例文件（新开发者模板）

#### 最佳实践

**安全性**:
- ❌ 不要将 `.env` 和 `.env.production` 提交到版本控制
- ✅ 确保 `.gitignore` 包含这些文件
- ✅ 使用强密码和复杂的JWT密钥

**开发流程**:
1. 新项目开始时运行 `pnpm run env:setup`
2. 定期运行 `pnpm run env:check` 验证配置
3. 部署前确保生产环境配置正确

## 📁 项目结构

```
nestjs-template/
├── src/                          # 源代码目录
│   ├── auth/                     # 认证模块
│   │   ├── dto/                  # 数据传输对象
│   │   ├── entities/             # 实体定义
│   │   ├── auth.controller.ts    # 认证控制器
│   │   ├── auth.service.ts       # 认证服务
│   │   └── auth.module.ts        # 认证模块
│   ├── files/                    # 文件管理模块
│   │   ├── adapters/             # 存储适配器
│   │   │   ├── ftp-storage.adapter.ts      # FTP存储适配器
│   │   │   └── s3-storage.adapter.ts       # S3存储适配器
│   │   ├── controllers/          # 控制器
│   │   │   ├── files.controller.ts         # 文件管理控制器
│   │   │   └── protocols.controller.ts     # 协议支持控制器
│   │   ├── services/             # 服务类
│   │   │   ├── files.service.ts            # 文件管理服务
│   │   │   ├── storage.service.ts          # 存储服务
│   │   │   ├── chunk.service.ts            # 分块上传服务
│   │   │   └── validation.service.ts       # 文件验证服务
│   │   ├── entities/             # 数据库实体
│   │   │   ├── file.entity.ts              # 文件实体
│   │   │   └── upload-chunk.entity.ts      # 上传分块实体
│   │   ├── dto/                  # 数据传输对象
│   │   ├── guards/               # 权限守卫
│   │   ├── decorators/           # 装饰器
│   │   ├── interfaces/           # 接口定义
│   │   └── files.module.ts       # 文件模块
│   ├── common/                   # 公共模块
│   ├── config/                   # 配置管理
│   │   ├── configuration.ts     # 配置对象
│   │   ├── app-config.service.ts # 配置服务
│   │   └── validation.schema.ts  # 配置验证
│   ├── utils/                    # 工具类
│   │   ├── api/                  # API工具
│   │   ├── decorators/           # 装饰器
│   │   ├── enums/                # 枚举定义
│   │   ├── guards/               # 守卫
│   │   └── passport/             # Passport策略
│   ├── app.controller.ts         # 应用控制器
│   ├── app.service.ts            # 应用服务
│   ├── app.module.ts             # 应用模块
│   └── main.ts                   # 应用入口
├── scripts/                      # 脚本工具
│   ├── check-env.js              # 环境检查工具
│   └── setup-env.js              # 环境设置工具
├── test/                         # 测试目录
├── .env.example                  # 环境变量示例
├── .env.development              # 开发环境配置
├── .env.production               # 生产环境配置
├── package.json                  # 项目配置
├── tsconfig.json                 # TypeScript配置
└── README.md                     # 项目说明
```

## 🔧 环境变量配置

### 必需变量

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `NEST_PORT` | 应用端口 | `8848` |
| `NEST_DATABASE_HOST` | 数据库主机 | `127.0.0.1` |
| `NEST_DATABASE_PORT` | 数据库端口 | `3306` |
| `NEST_DATABASE_USER` | 数据库用户名 | `root` |
| `NEST_DATABASE_PASSWORD` | 数据库密码 | `1234` |
| `NEST_DATABASE_NAME` | 数据库名称 | `dbtest` |
| `NEST_JWT_SECRET` | JWT密钥 | `xiaji-dev-secret-key-2024` |

### 可选变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `NEST_DATABASE_SYNCHRONIZE` | 数据库同步 | `true` |
| `NEST_DATABASE_LOGGING` | 数据库日志 | `false` |
| `NEST_JWT_EXPIRES_IN` | JWT过期时间 | `7d` |

## 🔐 API认证与验证码系统

### 认证流程
系统采用JWT + 验证码的双重认证机制：

1. **获取验证码**: `GET /auth/captcha`
2. **用户注册**: `POST /auth/register`
3. **用户登录**: `POST /auth/login`

### 验证码API详细说明

#### 获取验证码
```http
GET /auth/captcha
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "captchaImage": "data:image/svg+xml;base64,PHN2Zy...",
    "captchaToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "验证码获取成功"
}
```

**字段说明**:
- `captchaImage`: Base64编码的SVG验证码图片
- `captchaToken`: 验证码JWT令牌（5分钟有效期）

#### 用户注册
```http
POST /auth/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123",
  "captchaCode": "ABCD",
  "captchaToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "注册成功"
}
```

#### 用户登录
```http
POST /auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123",
  "captchaCode": "ABCD",
  "captchaToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 安全特性
- ✅ **防爬虫**: 验证码机制防止自动化攻击
- ✅ **令牌过期**: 验证码令牌5分钟自动过期
- ✅ **一次性使用**: 每个验证码只能使用一次
- ✅ **JWT认证**: 访问令牌7天有效期
- ✅ **密码加密**: bcrypt加密存储用户密码

### 使用访问令牌
获取JWT令牌后，在后续请求中携带：
```http
Authorization: Bearer <your-jwt-token>
```

## 📁 文件上传下载模块

### 功能特性
- ✅ **多种上传方式**: 单文件上传、批量文件上传、分块上传
- ✅ **断点续传**: 支持大文件分块上传和断点续传机制
- ✅ **多协议支持**: HTTP、FTP协议文件传输
- ✅ **安全验证**: 文件类型校验、大小限制、哈希验证
- ✅ **权限控制**: JWT认证集成，基于用户的文件访问控制
- ✅ **存储适配器**: 本地存储、FTP存储、云存储支持

### 核心API接口

#### 1. 单文件上传
```http
POST /files/upload
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data

Form Data:
- file: <文件>
- description: "文件描述" (可选)
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "filename": "example.pdf",
    "originalName": "原始文件名.pdf",
    "size": 1048576,
    "mimeType": "application/pdf",
    "downloadUrl": "/files/uuid-string/download",
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "文件上传成功"
}
```

#### 2. 批量文件上传
```http
POST /files/upload/batch
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data

Form Data:
- files: <文件1>
- files: <文件2>
- files: <文件3>
(最多10个文件)
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "uploaded": [
      {
        "id": "uuid-1",
        "filename": "file1.jpg",
        "size": 204800
      },
      {
        "id": "uuid-2", 
        "filename": "file2.png",
        "size": 512000
      }
    ],
    "failed": [],
    "total": 2,
    "successCount": 2
  },
  "message": "批量上传完成"
}
```

#### 3. 分块上传（大文件）

**步骤1: 初始化分块上传**
```http
POST /files/upload/chunk/init
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "filename": "large-video.mp4",
  "fileSize": 104857600,
  "chunkSize": 1048576,
  "totalChunks": 100,
  "mimeType": "video/mp4"
}
```

**步骤2: 上传分块**
```http
POST /files/upload/chunk
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data

Form Data:
- uploadId: "uuid-from-init"
- chunkNumber: 1
- chunk: <分块数据>
```

**步骤3: 完成上传**
```http
POST /files/upload/chunk/complete
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "uploadId": "uuid-from-init",
  "chunks": [1, 2, 3, ..., 100]
}
```

#### 4. 文件下载
```http
GET /files/:fileId/download
Authorization: Bearer <jwt-token>
```

#### 5. 文件预览
```http
GET /files/:fileId/preview
Authorization: Bearer <jwt-token>
```

#### 6. 文件列表查询
```http
GET /files?page=1&limit=10&type=image&search=关键词
Authorization: Bearer <jwt-token>
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10, 最大: 100)
- `type`: 文件类型过滤 (image/video/document/audio)
- `search`: 文件名搜索关键词

#### 7. 文件详情
```http
GET /files/:fileId
Authorization: Bearer <jwt-token>
```

#### 8. 删除文件
```http
DELETE /files/:fileId
Authorization: Bearer <jwt-token>
```

#### 9. 获取支持的协议
```http
GET /files/protocols/supported
Authorization: Bearer <jwt-token>
```

### 配置说明

#### 环境变量配置
在 `.env.development` 或 `.env.production` 中添加：

```bash
# 文件上传配置
MAX_FILE_SIZE=10485760          # 最大文件大小 (10MB)
MAX_BATCH_FILES=10              # 批量上传最大文件数
UPLOAD_PATH=./uploads           # 本地存储路径
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf  # 允许的文件类型

# FTP配置 (可选)
FTP_HOST=ftp.example.com
FTP_PORT=21
FTP_USER=username
FTP_PASSWORD=password
FTP_SECURE=false
FTP_BASE_PATH=/uploads

# AWS S3配置 (可选)
AWS_REGION=us-east-1
AWS_S3_BUCKET=my-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_ENDPOINT=https://s3.amazonaws.com
AWS_S3_BASE_PATH=uploads

# 存储类型选择
STORAGE_TYPE=LOCAL              # LOCAL | FTP | AWS_S3
```

### 使用注意事项

#### 安全性
- ✅ 所有文件操作都需要JWT认证
- ✅ 用户只能访问自己上传的文件
- ✅ 文件类型白名单验证
- ✅ 文件大小限制保护
- ✅ 文件哈希验证防篡改

#### 性能优化
- ✅ 大文件自动启用分块上传
- ✅ 支持断点续传，网络中断可恢复
- ✅ 批量上传并发处理
- ✅ 文件存储路径优化

#### 错误处理
常见错误码：
- `FILE_TOO_LARGE`: 文件大小超出限制
- `INVALID_FILE_TYPE`: 不支持的文件类型
- `UPLOAD_FAILED`: 上传失败
- `FILE_NOT_FOUND`: 文件不存在
- `ACCESS_DENIED`: 无权限访问
- `CHUNK_MISSING`: 分块缺失
- `STORAGE_ERROR`: 存储服务错误

#### 最佳实践

**前端集成示例**:
```javascript
// 单文件上传
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
};

// 分块上传大文件
const uploadLargeFile = async (file) => {
  const chunkSize = 1024 * 1024; // 1MB
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  // 1. 初始化
  const initResponse = await fetch('/files/upload/chunk/init', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: file.name,
      fileSize: file.size,
      chunkSize,
      totalChunks,
      mimeType: file.type
    })
  });
  
  const { uploadId } = await initResponse.json();
  
  // 2. 上传分块
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkNumber', i + 1);
    formData.append('chunk', chunk);
    
    await fetch('/files/upload/chunk', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
  }
  
  // 3. 完成上传
  const completeResponse = await fetch('/files/upload/chunk/complete', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      uploadId,
      chunks: Array.from({length: totalChunks}, (_, i) => i + 1)
    })
  });
  
  return completeResponse.json();
};
```

## 📚 API文档

启动开发服务器后，访问 Swagger 文档：
- **开发环境**: http://localhost:8848/api-docs
- **生产环境**: http://your-domain/api-docs

## 🧪 测试

```bash
# 运行所有测试
pnpm run test

# 运行测试并生成覆盖率报告
pnpm run test:cov

# 运行E2E测试
pnpm run test:e2e
```

## 🚀 部署

### 生产环境部署

1. **构建项目**:
```bash
pnpm run build
```

2. **配置生产环境变量**:
```bash
# 创建生产环境配置
cp .env.example .env.production
# 编辑生产环境配置
```

3. **启动生产服务**:
```bash
pnpm run start:prod
```

### Docker部署（可选）

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
EXPOSE 3000
CMD ["pnpm", "run", "start:prod"]
```

## 🤝 开发规范

### 代码风格
- 使用 ESLint + Prettier 进行代码格式化
- 遵循 TypeScript 严格模式
- 使用 Conventional Commits 规范

### 提交前检查
```bash
# 代码格式化
pnpm run format

# 代码检查
pnpm run lint

# 运行测试
pnpm run test

# 环境配置检查
pnpm run env:check
```

## 📝 更新日志

### v0.0.1 (当前版本)
- ✅ 基础项目架构搭建
- ✅ JWT认证系统
- ✅ 验证码功能
- ✅ 数据库集成
- ✅ API文档集成
- ✅ 环境配置工具
- ✅ 代码规范配置

## 🆘 故障排除

### 常见问题

**Q: 启动时报端口被占用**
```bash
# 检查端口占用
netstat -ano | findstr :8848
# 或修改 .env.development 中的端口
```

**Q: 数据库连接失败**
```bash
# 检查数据库服务状态
# 验证数据库配置信息
pnpm run env:check
```

**Q: 环境变量配置错误**
```bash
# 使用配置工具重新设置
pnpm run env:setup

# 或检查配置状态
pnpm run env:check
```

**Q: 验证码相关问题**
- 验证码图片无法显示：检查SVG格式支持
- 验证码验证失败：确保在5分钟有效期内使用
- 验证码令牌过期：重新获取验证码

**Q: JWT认证失败**
- 检查JWT_SECRET是否正确设置
- 确认访问令牌格式：`Authorization: Bearer <token>`
- 验证令牌是否在7天有效期内

## 📞 技术支持

如有问题，请：
1. 查看本README文档
2. 查看 `docs/environment-setup.md` 环境配置指南
3. 运行 `pnpm run env:check` 检查配置
4. 提交Issue或联系开发团队

---

**开发团队** | **版本** v0.0.1 | **最后更新** 2025-08-29