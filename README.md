# 我与夏季 Ra 系统 - 服务端

基于 NestJS 构建的现代化后端API系统，使用 TypeScript 开发，支持JWT认证、数据库ORM、API文档等功能。

## 🚀 项目特性

- ✅ **现代化架构**: 基于 NestJS 框架，采用模块化设计
- ✅ **类型安全**: 完全使用 TypeScript 开发
- ✅ **数据库支持**: 集成 TypeORM，支持 MySQL
- ✅ **身份认证**: JWT + Passport 认证体系
- ✅ **文件管理**: 完整的文件上传下载系统，支持分块上传、断点续传
- ✅ **多协议支持**: HTTP 文件传输协议
- ✅ **存储适配器**: 本地存储方案
- ✅ **API文档**: 集成 Swagger 自动生成文档
- ✅ **验证码系统**: SVG验证码，防爬虫机制
- ✅ **环境配置**: 完善的环境变量管理
- ✅ **代码质量**: ESLint + Prettier 代码规范

## 📋 技术栈

- **框架**: NestJS 10.x
- **语言**: TypeScript 5.x
- **数据库**: MySQL + TypeORM
- **认证**: JWT + Passport
- **文档**: Swagger/OpenAPI
- **包管理**: PNPM
- **代码规范**: ESLint + Prettier

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
│   ├── modules/                  # 业务模块
│   │   ├── auth/                 # 认证模块
│   │   │   ├── dto/              # 数据传输对象
│   │   │   │   ├── auth-response.dto.ts
│   │   │   │   ├── captcha-verify.dto.ts
│   │   │   │   ├── create-auth.dto.ts
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-auth.dto.ts
│   │   │   ├── entities/         # 实体定义
│   │   │   │   └── auth.entity.ts
│   │   │   ├── auth.controller.ts # 认证控制器
│   │   │   ├── auth.service.ts   # 认证服务
│   │   │   └── auth.module.ts    # 认证模块
│   │   └── files/                # 文件管理模块
│   │       ├── dto/              # 数据传输对象
│   │       │   ├── file-query.dto.ts
│   │       │   ├── file-upload.dto.ts
│   │       │   ├── index.ts
│   │       │   └── swagger-responses.dto.ts
│   │       ├── entities/         # 数据库实体
│   │       │   ├── file.entity.ts
│   │       │   ├── index.ts
│   │       │   └── upload-chunk.entity.ts
│   │       ├── services/         # 服务类
│   │       │   ├── chunk.service.ts        # 分块上传服务
│   │       │   ├── files.service.ts        # 文件管理服务
│   │       │   ├── storage-factory.service.ts # 存储工厂服务
│   │       │   ├── storage.service.ts      # 存储服务
│   │       │   └── validation.service.ts   # 文件验证服务
│   │       ├── decorators/       # 装饰器
│   │       │   ├── file-permissions.decorator.ts
│   │       │   └── index.ts
│   │       ├── guards/           # 权限守卫
│   │       │   └── file-access.guard.ts
│   │       ├── interfaces/       # 接口定义
│   │       │   ├── file-upload.interface.ts
│   │       │   ├── index.ts
│   │       │   ├── storage-factory.interface.ts
│   │       │   └── storage.interface.ts
│   │       ├── enums/            # 枚举定义
│   │       │   ├── file-status.enum.ts
│   │       │   ├── file-type.enum.ts
│   │       │   └── index.ts
│   │       ├── files.controller.ts # 文件管理控制器
│   │       └── files.module.ts   # 文件模块
│   ├── common/                   # 公共模块
│   │   ├── constants/            # 常量定义
│   │   │   ├── auth.constant.ts
│   │   │   ├── index.ts
│   │   │   └── response.constant.ts
│   │   ├── decorators/           # 装饰器
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── index.ts
│   │   │   ├── jwt-auth.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── user.decorator.ts
│   │   ├── enums/                # 枚举定义
│   │   │   ├── gender.enum.ts
│   │   │   ├── index.ts
│   │   │   └── role.enum.ts
│   │   ├── exceptions/           # 异常处理
│   │   │   ├── http.exception.ts
│   │   │   └── index.ts
│   │   ├── filters/              # 过滤器
│   │   │   ├── http-exception.filter.ts
│   │   │   └── index.ts
│   │   ├── guards/               # 守卫
│   │   │   ├── global.guard.ts
│   │   │   ├── index.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/         # 拦截器
│   │   │   ├── index.ts
│   │   │   └── response.interceptor.ts
│   │   ├── interfaces/           # 接口定义
│   │   │   ├── error-response.interface.ts
│   │   │   ├── index.ts
│   │   │   └── response.interface.ts
│   │   ├── pipes/                # 管道
│   │   │   ├── file-validation.pipe.ts
│   │   │   └── index.ts
│   │   └── strategies/           # 认证策略
│   │       ├── index.ts
│   │       └── jwt-auth.strategy.ts
│   ├── config/                   # 配置管理
│   │   ├── app-config.service.ts # 配置服务
│   │   ├── config.module.ts      # 配置模块
│   │   ├── configuration.ts      # 配置对象
│   │   ├── index.ts              # 配置导出
│   │   └── validation.schema.ts  # 配置验证
│   ├── utils/                    # 工具模块
│   │   ├── auth/                 # 认证工具
│   │   │   ├── index.ts
│   │   │   └── whitelist.auth.ts
│   │   ├── helpers/              # 辅助函数
│   │   │   ├── capitalize.helper.ts
│   │   │   ├── date.helper.ts
│   │   │   ├── debounce.helper.ts
│   │   │   ├── deep-clone.helper.ts
│   │   │   ├── format-date.helper.ts
│   │   │   ├── index.ts
│   │   │   ├── random-string.helper.ts
│   │   │   ├── throttle.helper.ts
│   │   │   └── uuid.helper.ts
│   │   ├── validators/           # 验证工具
│   │   │   ├── date.validator.ts
│   │   │   ├── email.validator.ts
│   │   │   ├── id-card.validator.ts
│   │   │   ├── index.ts
│   │   │   ├── number.validator.ts
│   │   │   ├── phone.validator.ts
│   │   │   ├── string.validator.ts
│   │   │   └── url.validator.ts
│   │   └── index.ts              # 工具统一导出
│   ├── app.controller.ts         # 应用控制器
│   ├── app.service.ts            # 应用服务
│   ├── app.module.ts             # 应用模块
│   └── main.ts                   # 应用入口
├── scripts/                      # 脚本工具
│   ├── check-env.js              # 环境检查工具
│   └── setup-env.js              # 环境设置工具
├── static/                       # 静态资源目录
├── .env                          # 环境变量（公共配置）
├── .env.development              # 开发环境配置
├── .env.production               # 生产环境配置
├── .eslintrc.js                  # ESLint配置
├── .gitignore                    # Git忽略文件
├── .prettierrc                   # Prettier配置
├── nest-cli.json                 # NestJS CLI配置
├── package.json                  # 项目配置
├── pnpm-lock.yaml                # PNPM锁定文件
├── tsconfig.json                 # TypeScript配置
└── README.md                     # 项目说明
```

## 🛠️ 工具模块 (src/utils)

### 概述

`src/utils` 模块提供了项目中使用的各种工具函数和辅助类，采用模块化设计，统一导出，便于在整个项目中复用。

### 模块结构

```
src/utils/
├── index.ts                    # 统一导出入口
├── auth/                       # 认证工具
│   ├── index.ts               # 认证工具导出
│   └── whitelist.auth.ts      # 白名单认证工具
├── helpers/                    # 辅助函数
│   ├── index.ts               # 辅助函数导出
│   ├── capitalize.helper.ts   # 字符串首字母大写
│   ├── date.helper.ts         # 日期处理工具
│   ├── debounce.helper.ts     # 防抖函数
│   ├── deep-clone.helper.ts   # 深拷贝工具
│   ├── format-date.helper.ts  # 日期格式化
│   ├── random-string.helper.ts # 随机字符串生成
│   ├── throttle.helper.ts     # 节流函数
│   └── uuid.helper.ts         # UUID工具
└── validators/                 # 验证工具
    ├── index.ts               # 验证工具导出
    ├── email.validator.ts     # 邮箱验证
    ├── phone.validator.ts     # 手机号验证
    ├── id-card.validator.ts   # 身份证验证
    ├── url.validator.ts       # URL验证
    ├── number.validator.ts    # 数字验证
    ├── string.validator.ts    # 字符串验证
    └── date.validator.ts      # 日期验证
```

### 使用方式

#### 统一导入（推荐）

```typescript
// 从主入口导入所有工具
import {
  WhitelistAuth,
  debounce,
  // 认证工具
  formatDate,
  // 辅助函数
  isEmail,
  isPhone, // 验证工具
} from 'src/utils';
```

#### 分模块导入

```typescript
// 从特定模块导入
import { WhitelistAuth } from 'src/utils/auth';
import { debounce, formatDate } from 'src/utils/helpers';
import { isEmail, isPhone } from 'src/utils/validators';
```

### 认证工具 (auth)

#### WhitelistAuth - 白名单认证

提供基于白名单的认证机制，支持IP地址和用户ID的白名单验证。

```typescript
import { WhitelistAuth } from 'src/utils';

// 创建白名单认证实例
const whitelist = new WhitelistAuth({
  ipWhitelist: ['127.0.0.1', '192.168.1.0/24'],
  userWhitelist: ['admin', 'user1'],
});

// 验证IP地址
const isIpAllowed = whitelist.validateIp('127.0.0.1'); // true

// 验证用户
const isUserAllowed = whitelist.validateUser('admin'); // true
```

### 辅助函数 (helpers)

#### 字符串处理

```typescript
import { capitalize, randomString } from 'src/utils';

// 首字母大写
const result = capitalize('hello world'); // "Hello world"

// 生成随机字符串
const random = randomString(10); // "aBc123XyZ9"
```

#### 时间处理

```typescript
import { formatDate, getCurrentTimestamp } from 'src/utils';

// 格式化日期
const formatted = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');

// 获取当前时间戳
const timestamp = getCurrentTimestamp(); // 1640995200000
```

#### 性能优化

```typescript
import { debounce, throttle } from 'src/utils';

// 防抖函数 - 延迟执行，多次调用只执行最后一次
const debouncedFn = debounce(() => {
  console.log('搜索请求');
}, 300);

// 节流函数 - 限制执行频率
const throttledFn = throttle(() => {
  console.log('滚动事件');
}, 100);
```

#### 数据处理

```typescript
import { deepClone } from 'src/utils';

// 深拷贝对象
const original = { a: 1, b: { c: 2 } };
const cloned = deepClone(original);
```

#### UUID工具

```typescript
import { generateUUID, generateUUIDv4, generateUUIDv7, validateUUID } from 'src/utils';

// 生成UUID v4
const uuid4 = generateUUIDv4(); // "550e8400-e29b-41d4-a716-446655440000"

// 生成UUID v7 (时间排序)
const uuid7 = generateUUIDv7(); // "01234567-89ab-7def-8000-123456789abc"

// 验证UUID格式
const isValid = validateUUID(uuid4); // true
```

### 验证工具 (validators)

#### 邮箱验证

```typescript
import { isCorporateEmail, isEmail, isEmailDomainAllowed, isEmailStrict } from 'src/utils';

// 基础邮箱验证
const valid1 = isEmail('user@example.com'); // true

// 严格邮箱验证
const valid2 = isEmailStrict('user@example.com'); // true

// 企业邮箱验证（排除个人邮箱域名）
const valid3 = isCorporateEmail('user@company.com'); // true
const valid4 = isCorporateEmail('user@gmail.com'); // false

// 域名白名单验证
const valid5 = isEmailDomainAllowed('user@company.com', ['company.com']); // true
```

#### 手机号验证

```typescript
import { formatPhoneDisplay, isInternationalPhone, isPhone, isPhoneStrict } from 'src/utils';

// 中国大陆手机号验证
const valid1 = isPhone('13800138000'); // true

// 严格手机号验证（包含具体号段）
const valid2 = isPhoneStrict('13800138000'); // true

// 国际手机号验证
const valid3 = isInternationalPhone('+8613800138000'); // true

// 手机号脱敏显示
const masked = formatPhoneDisplay('13800138000'); // "138****8000"
```

#### 身份证验证

```typescript
import {
  extractBirthFromIdCard,
  extractGenderFromIdCard,
  formatIdCardDisplay,
  isIdCard,
  isIdCardStrict,
} from 'src/utils';

const idCard = '110101199001011234';

// 基础身份证验证
const valid1 = isIdCard(idCard); // true

// 严格验证（包含校验位）
const valid2 = isIdCardStrict(idCard); // true

// 提取生日
const birth = extractBirthFromIdCard(idCard); // "1990-01-01"

// 提取性别
const gender = extractGenderFromIdCard(idCard); // "male" | "female"

// 身份证脱敏显示
const masked = formatIdCardDisplay(idCard); // "110101********1234"
```

#### URL验证

```typescript
import { isDomain, isHttpUrl, isHttpsUrl, isIpAddress, isUrl } from 'src/utils';

// URL验证
const valid1 = isUrl('https://example.com'); // true

// HTTP URL验证
const valid2 = isHttpUrl('http://example.com'); // true

// HTTPS URL验证
const valid3 = isHttpsUrl('https://example.com'); // true

// 域名验证
const valid4 = isDomain('example.com'); // true

// IP地址验证
const valid5 = isIpAddress('192.168.1.1'); // true
```

#### 数字验证

```typescript
import { isFloat, isInRange, isInteger, isMoney, isPercentage, isPositiveInteger } from 'src/utils';

// 整数验证
const valid1 = isInteger(123); // true

// 正整数验证
const valid2 = isPositiveInteger(123); // true

// 浮点数验证
const valid3 = isFloat(123.45); // true

// 范围验证
const valid4 = isInRange(50, 0, 100); // true

// 百分比验证
const valid5 = isPercentage(85.5); // true

// 金额验证（最多2位小数）
const valid6 = isMoney(123.45); // true
```

#### 字符串验证

```typescript
import {
  hasSpecialChars,
  isAlpha,
  isAlphanumeric,
  isChinese,
  isEmpty,
  isLengthInRange,
  isStrongPassword,
  isUsername,
} from 'src/utils';

// 空字符串验证
const valid1 = isEmpty('   '); // true

// 长度范围验证
const valid2 = isLengthInRange('hello', 3, 10); // true

// 纯字母验证
const valid3 = isAlpha('hello'); // true

// 字母数字验证
const valid4 = isAlphanumeric('hello123'); // true

// 中文字符验证
const valid5 = isChinese('你好'); // true

// 用户名验证（字母数字下划线，3-20位）
const valid6 = isUsername('user_123'); // true

// 强密码验证（至少8位，包含大小写字母数字）
const valid7 = isStrongPassword('Password123'); // true

// 特殊字符检测
const valid8 = hasSpecialChars('hello@world'); // true
```

#### 日期验证

```typescript
import { isDateFormat, isDateTimeFormat, isTimeFormat, isValidDate } from 'src/utils';

// 有效日期验证
const valid1 = isValidDate('2024-01-01'); // true

// 日期格式验证 (YYYY-MM-DD)
const valid2 = isDateFormat('2024-01-01'); // true

// 时间格式验证 (HH:mm:ss)
const valid3 = isTimeFormat('12:30:45'); // true

// 日期时间格式验证 (YYYY-MM-DD HH:mm:ss)
const valid4 = isDateTimeFormat('2024-01-01 12:30:45'); // true
```

### 最佳实践

#### 1. 统一导入

推荐使用统一导入方式，从 `src/utils` 主入口导入所需工具：

```typescript
// ✅ 推荐
import { isEmail, formatDate, WhitelistAuth } from 'src/utils';

// ❌ 不推荐
import { isEmail } from 'src/utils/validators/email.validator';
import { formatDate } from 'src/utils/helpers/format-date.helper';
```

#### 2. 类型安全

所有工具函数都提供了完整的 TypeScript 类型定义：

```typescript
import { formatDate, isEmail } from 'src/utils';

// 类型推断
const emailValid: boolean = isEmail('test@example.com');
const formattedDate: string = formatDate(new Date());
```

#### 3. 错误处理

验证函数返回布尔值，建议结合错误处理使用：

```typescript
import { isEmail, isPhone } from 'src/utils';

function validateUserInput(email: string, phone: string) {
  if (!isEmail(email)) {
    throw new Error('邮箱格式不正确');
  }

  if (!isPhone(phone)) {
    throw new Error('手机号格式不正确');
  }

  return true;
}
```

#### 4. 性能优化

对于频繁调用的场景，使用防抖和节流函数：

```typescript
import { debounce, throttle } from 'src/utils';

// 搜索输入防抖
const handleSearch = debounce((keyword: string) => {
  // 执行搜索
}, 300);

// 滚动事件节流
const handleScroll = throttle(() => {
  // 处理滚动
}, 100);
```

### 扩展工具模块

如需添加新的工具函数：

1. **创建工具文件**：在对应子目录下创建新的工具文件
2. **导出工具**：在子目录的 `index.ts` 中导出
3. **统一导出**：在 `src/utils/index.ts` 中添加导出
4. **更新文档**：更新本文档说明

```typescript
// 示例：添加新的字符串工具
// src/utils/helpers/slug.helper.ts
export const createSlug = (text: string): string => {
  return text.toLowerCase().replace(/\s+/g, '-');
};

// src/utils/helpers/index.ts
export * from './slug.helper';

// src/utils/index.ts
export * from './helpers';
```

## ⚙️ 配置管理

### 配置系统架构

项目采用分层配置管理架构，支持环境变量、默认值和类型安全：

```
src/config/
├── index.ts              # 配置导出入口
├── configuration.ts      # 配置对象定义
├── app-config.service.ts # 配置服务类
├── config.module.ts      # 配置模块
└── validation.schema.ts  # 配置验证模式
```

### 配置服务使用

#### 1. 基本配置获取

```typescript
import { appConfig } from 'src/config';

// 获取应用基本信息
const appTitle = appConfig.appTitle; // "我与夏季 Ra 系统 - 开发环境"
const port = appConfig.port; // 8848
const environment = appConfig.environment; // "development"

// 环境判断
const isDev = appConfig.isDevelopment; // true
const isProd = appConfig.isProduction; // false
```

#### 2. 数据库配置

```typescript
// 获取数据库配置
const dbConfig = appConfig.databaseConfig;
/*
{
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: '****',
  database: 'dbtest',
  synchronize: true,
  logging: false
}
*/
```

#### 3. JWT 配置

```typescript
// JWT 配置
const jwtConfig = appConfig.jwtOptions;
/*
{
  secret: 'your-jwt-secret',
  expiresIn: '1d'
}
*/
```

#### 4. 静态资源配置

```typescript
// 静态资源配置
const staticConfig = appConfig.staticAssetsOptions;
/*
{
  root: './static',
  options: {
    prefix: '/static',
    maxAge: '86400'
  }
}
*/
```

#### 5. CORS 配置

```typescript
// CORS 配置
const corsConfig = appConfig.corsOptions;
/*
{
  origin: ['http://localhost:3000', 'http://localhost:9527'],
  credentials: true
}
*/
```

#### 6. Swagger 配置

```typescript
// Swagger 配置
const swaggerConfig = appConfig.swaggerOptions;
/*
{
  title: '我与夏季 Ra API - 开发版',
  description: '我与夏季 Ra 系统API文档 - 开发环境',
  version: '1.0.0',
  prefix: '/api-docs',
  enabled: true
}
*/
```

### 环境变量配置

#### 必需环境变量

| 变量名                   | 描述         | 示例值            | 默认值      |
| ------------------------ | ------------ | ----------------- | ----------- |
| `NEST_PORT`              | 应用端口     | `8848`            | `3000`      |
| `NEST_DATABASE_HOST`     | 数据库主机   | `127.0.0.1`       | `localhost` |
| `NEST_DATABASE_PORT`     | 数据库端口   | `3306`            | `3306`      |
| `NEST_DATABASE_USER`     | 数据库用户名 | `root`            | -           |
| `NEST_DATABASE_PASSWORD` | 数据库密码   | `password`        | -           |
| `NEST_DATABASE_NAME`     | 数据库名称   | `dbtest`          | -           |
| `NEST_JWT_SECRET`        | JWT密钥      | `your-secret-key` | -           |

#### 可选环境变量

| 变量名                      | 描述             | 示例值                                        | 默认值            |
| --------------------------- | ---------------- | --------------------------------------------- | ----------------- |
| `NEST_USER_NODE_ENV`        | 运行环境         | `development`                                 | `development`     |
| `NEST_JWT_ACCESS_TOKEN_TTL` | JWT过期时间      | `7d`                                          | `1d`              |
| `NEST_DATABASE_SYNCHRONIZE` | 数据库同步       | `true`                                        | 开发环境为 `true` |
| `NEST_DATABASE_LOGGING`     | 数据库日志       | `true`                                        | `false`           |
| `NEST_STATIC_ASSETS_PATH`   | 静态资源路径     | `./uploads`                                   | `./static`        |
| `NEST_STATIC_ASSETS_URL`    | 静态资源URL前缀  | `/static`                                     | `/static`         |
| `NEST_STATIC_ASSETS_MAXAGE` | 静态资源缓存时间 | `86400`                                       | `86400`           |
| `NEST_CORS_ORIGINS`         | CORS允许的源     | `http://localhost:3000,http://localhost:9527` | 默认配置          |
| `NEST_SWAGGER_PREFIX`       | Swagger路径前缀  | `/docs`                                       | `/api-docs`       |
| `NEST_ENABLE_DEBUG`         | 启用调试模式     | `true`                                        | `false`           |
| `NEST_LOG_LEVEL`            | 日志级别         | `debug`                                       | `info`            |

### 配置文件示例

#### .env.development

```bash
# 应用配置
NEST_PORT=8848
NEST_USER_NODE_ENV=development

# 数据库配置
NEST_DATABASE_HOST=127.0.0.1
NEST_DATABASE_PORT=3306
NEST_DATABASE_USER=root
NEST_DATABASE_PASSWORD=your_password
NEST_DATABASE_NAME=dbtest
NEST_DATABASE_SYNCHRONIZE=true
NEST_DATABASE_LOGGING=false

# JWT配置
NEST_JWT_SECRET=xiaji-dev-secret-key-2024
NEST_JWT_ACCESS_TOKEN_TTL=7d

# 静态资源配置
NEST_STATIC_ASSETS_PATH=./static
NEST_STATIC_ASSETS_URL=/static
NEST_STATIC_ASSETS_MAXAGE=86400

# CORS配置
NEST_CORS_ORIGINS=http://localhost:3000,http://localhost:9527

# Swagger配置
NEST_SWAGGER_PREFIX=/api-docs

# 调试配置
NEST_ENABLE_DEBUG=true
NEST_LOG_LEVEL=debug
```

#### .env.production

```bash
# 应用配置
NEST_PORT=3000
NEST_USER_NODE_ENV=production

# 数据库配置
NEST_DATABASE_HOST=your-production-db-host
NEST_DATABASE_PORT=3306
NEST_DATABASE_USER=your-production-user
NEST_DATABASE_PASSWORD=your-strong-production-password
NEST_DATABASE_NAME=your-production-db
NEST_DATABASE_SYNCHRONIZE=false
NEST_DATABASE_LOGGING=false

# JWT配置
NEST_JWT_SECRET=your-very-strong-production-secret
NEST_JWT_ACCESS_TOKEN_TTL=1d

# 静态资源配置
NEST_STATIC_ASSETS_PATH=/var/www/static
NEST_STATIC_ASSETS_URL=/static
NEST_STATIC_ASSETS_MAXAGE=2592000

# CORS配置
NEST_CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# 调试配置
NEST_ENABLE_DEBUG=false
NEST_LOG_LEVEL=error
```

### 在模块中使用配置

#### 1. 注入配置服务

```typescript
import { AppConfigService } from 'src/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class YourService {
  constructor(private readonly appConfig: AppConfigService) {}

  someMethod() {
    const port = this.appConfig.port;
    const isDev = this.appConfig.isDevelopment;
    // 使用配置...
  }
}
```

#### 2. 直接导入配置

```typescript
import { appConfig } from 'src/config';

// 在任何地方使用
const dbConfig = appConfig.databaseConfig;
const jwtOptions = appConfig.jwtOptions;
```

#### 3. 在模块中配置服务

```typescript
import { appConfig } from 'src/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...appConfig.databaseConfig,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
    }),
  ],
})
export class DatabaseModule {}
```

### 配置验证

项目使用 Joi 进行配置验证，确保所有必需的环境变量都已正确设置：

```typescript
// src/config/validation.schema.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NEST_PORT: Joi.number().default(3000),
  NEST_DATABASE_HOST: Joi.string().required(),
  NEST_DATABASE_PORT: Joi.number().default(3306),
  NEST_DATABASE_USER: Joi.string().required(),
  NEST_DATABASE_PASSWORD: Joi.string().required(),
  NEST_DATABASE_NAME: Joi.string().required(),
  NEST_JWT_SECRET: Joi.string().required(),
  // 其他验证规则...
});
```

### 配置最佳实践

#### 1. 安全性

- ✅ 敏感信息使用环境变量
- ✅ 生产环境使用强密码
- ✅ 不要将 `.env` 文件提交到版本控制
- ✅ 使用配置验证确保必需变量存在

#### 2. 可维护性

- ✅ 为所有配置提供默认值
- ✅ 使用类型安全的配置服务
- ✅ 按功能模块组织配置
- ✅ 添加详细的配置注释

#### 3. 环境管理

- ✅ 不同环境使用不同的配置文件
- ✅ 开发环境启用调试功能
- ✅ 生产环境关闭不必要的功能
- ✅ 使用环境检查工具验证配置

### 配置工具

使用项目提供的配置工具：

```bash
# 检查配置状态
pnpm run env:check

# 交互式配置设置
pnpm run env:setup
```

这些工具会自动验证配置的完整性和正确性。

## 📁 静态资源配置集成

### Files模块配置更新

Files模块已经完全集成了项目的静态资源配置系统，确保文件上传和访问使用统一的配置管理。

#### 主要改进

- ✅ **统一路径管理**: 使用`src/config`中的静态资源配置
- ✅ **环境变量支持**: 通过`NEST_STATIC_ASSETS_PATH`配置存储路径
- ✅ **URL前缀配置**: 通过`NEST_STATIC_ASSETS_URL`配置访问路径
- ✅ **缓存控制**: 支持静态资源缓存时间配置

#### 相关环境变量

```bash
# 静态资源路径（文件存储位置）
NEST_STATIC_ASSETS_PATH=./static

# 静态资源URL前缀（文件访问路径）
NEST_STATIC_ASSETS_URL=/static

# 静态资源缓存时间（秒）
NEST_STATIC_ASSETS_MAXAGE=86400
```

#### 文件存储结构

```
static/                    # 配置的静态资源根目录
├── 2025-08/              # 按年月分组
│   ├── file1_timestamp.jpg
│   ├── file2_timestamp.pdf
│   └── ...
├── 2025-09/
│   └── ...
```

#### 访问方式

- **直接访问**: `http://localhost:8848/static/2025-08/filename.jpg`
- **API下载**: `http://localhost:8848/files/{fileId}/download`
- **API预览**: `http://localhost:8848/files/{fileId}/preview`

## 🔧 环境变量配置

### 必需变量

| 变量名                   | 描述         | 示例值                      |
| ------------------------ | ------------ | --------------------------- |
| `NEST_PORT`              | 应用端口     | `8848`                      |
| `NEST_DATABASE_HOST`     | 数据库主机   | `127.0.0.1`                 |
| `NEST_DATABASE_PORT`     | 数据库端口   | `3306`                      |
| `NEST_DATABASE_USER`     | 数据库用户名 | `root`                      |
| `NEST_DATABASE_PASSWORD` | 数据库密码   | `1234`                      |
| `NEST_DATABASE_NAME`     | 数据库名称   | `dbtest`                    |
| `NEST_JWT_SECRET`        | JWT密钥      | `xiaji-dev-secret-key-2024` |

### 可选变量

| 变量名                      | 描述        | 默认值  |
| --------------------------- | ----------- | ------- |
| `NEST_DATABASE_SYNCHRONIZE` | 数据库同步  | `true`  |
| `NEST_DATABASE_LOGGING`     | 数据库日志  | `false` |
| `NEST_JWT_EXPIRES_IN`       | JWT过期时间 | `7d`    |

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

## 📁 文件上传下载模块 API 文档

### 概述

本文档详细描述了 NestJS 文件上传下载模块的所有 API 接口。该模块提供了完整的文件管理功能，包括单文件上传、批量上传、分块上传、断点续传、文件下载、预览等功能。

### 基础信息

- **Base URL**: `/files`
- **认证方式**: JWT Bearer Token
- **支持格式**: JSON, multipart/form-data
- **API版本**: v1.0

### 认证说明

所有 API 接口都需要在请求头中携带有效的 JWT Token：

```http
Authorization: Bearer <your-jwt-token>
```

### 通用响应格式

#### 成功响应

```json
{
  "success": true,
  "data": {
    // 具体数据
  },
  "message": "请求成功"
}
```

#### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": "详细错误信息"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## API 接口详情

### 1. 文件上传

#### 1.1 单文件上传

**接口地址**: `POST /files/upload`

**请求格式**: `multipart/form-data`

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| file | File | 是 | 要上传的文件 |
| description | string | 否 | 文件描述 |
| tags | string | 否 | 文件标签，多个标签用逗号分隔 |

**请求示例**:

```http
POST /files/upload
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="example.pdf"
Content-Type: application/pdf

[文件二进制数据]
--boundary
Content-Disposition: form-data; name="description"

这是一个示例PDF文件
--boundary--
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "example_20240101_123456.pdf",
    "originalName": "example.pdf",
    "size": 1048576,
    "mimeType": "application/pdf",
    "hash": "sha256:a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
    "description": "这是一个示例PDF文件",
    "tags": [],
    "downloadUrl": "/files/550e8400-e29b-41d4-a716-446655440000/download",
    "previewUrl": "/files/550e8400-e29b-41d4-a716-446655440000/preview",
    "uploadedAt": "2024-01-01T12:34:56.789Z"
  },
  "message": "文件上传成功"
}
```

#### 1.2 批量文件上传

**接口地址**: `POST /files/upload/batch`

**请求格式**: `multipart/form-data`

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| files | File[] | 是 | 要上传的文件数组（最多10个） |
| description | string | 否 | 批量文件描述 |

**请求示例**:

```http
POST /files/upload/batch
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="files"; filename="file1.jpg"
Content-Type: image/jpeg

[文件1二进制数据]
--boundary
Content-Disposition: form-data; name="files"; filename="file2.png"
Content-Type: image/png

[文件2二进制数据]
--boundary--
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "uploaded": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "filename": "file1_20240101_123456.jpg",
        "originalName": "file1.jpg",
        "size": 204800,
        "mimeType": "image/jpeg"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "filename": "file2_20240101_123457.png",
        "originalName": "file2.png",
        "size": 512000,
        "mimeType": "image/png"
      }
    ],
    "failed": [],
    "total": 2,
    "successCount": 2,
    "failedCount": 0
  },
  "message": "批量上传完成"
}
```

#### 1.3 分块上传（大文件）

分块上传适用于大文件（>10MB），支持断点续传功能。

##### 1.3.1 初始化分块上传

**接口地址**: `POST /files/upload/chunk/init`

**请求格式**: `application/json`

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| filename | string | 是 | 文件名 |
| fileSize | number | 是 | 文件总大小（字节） |
| chunkSize | number | 是 | 分块大小（字节，建议1MB） |
| totalChunks | number | 是 | 总分块数 |
| mimeType | string | 是 | 文件MIME类型 |
| description | string | 否 | 文件描述 |

**请求示例**:

```json
{
  "filename": "large-video.mp4",
  "fileSize": 104857600,
  "chunkSize": 1048576,
  "totalChunks": 100,
  "mimeType": "video/mp4",
  "description": "大视频文件"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "uploadId": "upload_550e8400-e29b-41d4-a716-446655440000",
    "chunkSize": 1048576,
    "totalChunks": 100,
    "expiresAt": "2024-01-01T13:34:56.789Z"
  },
  "message": "分块上传初始化成功"
}
```

##### 1.3.2 上传分块

**接口地址**: `POST /files/upload/chunk`

**请求格式**: `multipart/form-data`

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| uploadId | string | 是 | 上传ID（来自初始化响应） |
| chunkNumber | number | 是 | 分块序号（从1开始） |
| chunk | File | 是 | 分块数据 |

**请求示例**:

```http
POST /files/upload/chunk
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="uploadId"

upload_550e8400-e29b-41d4-a716-446655440000
--boundary
Content-Disposition: form-data; name="chunkNumber"

1
--boundary
Content-Disposition: form-data; name="chunk"; filename="chunk"
Content-Type: application/octet-stream

[分块二进制数据]
--boundary--
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "uploadId": "upload_550e8400-e29b-41d4-a716-446655440000",
    "chunkNumber": 1,
    "chunkHash": "sha256:b5d4045c3f466fa91fe2cc6abe79232a1a57cdf104f7a26e716e0a1e2789df78",
    "uploadedChunks": [1],
    "remainingChunks": 99
  },
  "message": "分块上传成功"
}
```

##### 1.3.3 完成分块上传

**接口地址**: `POST /files/upload/chunk/complete`

**请求格式**: `application/json`

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| uploadId | string | 是 | 上传ID |
| chunks | number[] | 是 | 已上传的分块序号数组 |

**请求示例**:

```json
{
  "uploadId": "upload_550e8400-e29b-41d4-a716-446655440000",
  "chunks": [1, 2, 3, 4, 5, ..., 100]
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "large-video_20240101_123456.mp4",
    "originalName": "large-video.mp4",
    "size": 104857600,
    "mimeType": "video/mp4",
    "hash": "sha256:c3499c2729730a7f807efb8676a92dcb6f8a3f8f6c7a5c6c5c6c5c6c5c6c5c6c",
    "downloadUrl": "/files/550e8400-e29b-41d4-a716-446655440000/download",
    "uploadedAt": "2024-01-01T12:45:30.123Z"
  },
  "message": "文件上传完成"
}
```

##### 1.3.4 查询上传状态

**接口地址**: `GET /files/upload/chunk/status/:uploadId`

**请求参数**: 无

**响应示例**:

```json
{
  "success": true,
  "data": {
    "uploadId": "upload_550e8400-e29b-41d4-a716-446655440000",
    "status": "uploading",
    "totalChunks": 100,
    "uploadedChunks": [1, 2, 3, 5, 7],
    "missingChunks": [4, 6, 8, 9, 10, ..., 100],
    "progress": 5.0,
    "expiresAt": "2024-01-01T13:34:56.789Z"
  },
  "message": "获取上传状态成功"
}
```

### 2. 文件下载

#### 2.1 文件下载

**接口地址**: `GET /files/:fileId/download`

**请求参数**: 无

**响应**: 文件流

**请求示例**:

```http
GET /files/550e8400-e29b-41d4-a716-446655440000/download
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应头**:

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="example.pdf"
Content-Length: 1048576
```

#### 2.2 文件预览

**接口地址**: `GET /files/:fileId/preview`

**请求参数**: 无

**响应**: 文件流（inline显示）

**请求示例**:

```http
GET /files/550e8400-e29b-41d4-a716-446655440000/preview
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应头**:

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: inline; filename="example.pdf"
Content-Length: 1048576
```

### 3. 文件管理

#### 3.1 获取文件列表

**接口地址**: `GET /files`

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| page | number | 否 | 页码（默认: 1） |
| limit | number | 否 | 每页数量（默认: 10，最大: 100） |
| type | string | 否 | 文件类型过滤（image/video/document/audio） |
| search | string | 否 | 文件名搜索关键词 |
| sortBy | string | 否 | 排序字段（createdAt/size/filename） |
| sortOrder | string | 否 | 排序方向（asc/desc，默认: desc） |

**请求示例**:

```http
GET /files?page=1&limit=10&type=image&search=avatar&sortBy=createdAt&sortOrder=desc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "filename": "avatar_20240101_123456.jpg",
        "originalName": "avatar.jpg",
        "size": 204800,
        "mimeType": "image/jpeg",
        "description": "用户头像",
        "tags": ["avatar", "profile"],
        "downloadUrl": "/files/550e8400-e29b-41d4-a716-446655440001/download",
        "previewUrl": "/files/550e8400-e29b-41d4-a716-446655440001/preview",
        "uploadedAt": "2024-01-01T12:34:56.789Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "获取文件列表成功"
}
```

#### 3.2 获取文件详情

**接口地址**: `GET /files/:fileId`

**请求参数**: 无

**请求示例**:

```http
GET /files/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "example_20240101_123456.pdf",
    "originalName": "example.pdf",
    "size": 1048576,
    "mimeType": "application/pdf",
    "hash": "sha256:a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
    "description": "这是一个示例PDF文件",
    "tags": ["document", "example"],
    "downloadUrl": "/files/550e8400-e29b-41d4-a716-446655440000/download",
    "previewUrl": "/files/550e8400-e29b-41d4-a716-446655440000/preview",
    "uploadProtocol": "HTTP",
    "status": "COMPLETED",
    "uploadedAt": "2024-01-01T12:34:56.789Z",
    "updatedAt": "2024-01-01T12:34:56.789Z"
  },
  "message": "获取文件详情成功"
}
```

#### 3.3 更新文件信息

**接口地址**: `PATCH /files/:fileId`

**请求格式**: `application/json`

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| description | string | 否 | 文件描述 |
| tags | string[] | 否 | 文件标签数组 |

**请求示例**:

```json
{
  "description": "更新后的文件描述",
  "tags": ["updated", "document", "important"]
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "description": "更新后的文件描述",
    "tags": ["updated", "document", "important"],
    "updatedAt": "2024-01-01T13:00:00.000Z"
  },
  "message": "文件信息更新成功"
}
```

#### 3.4 删除文件

**接口地址**: `DELETE /files/:fileId`

**请求参数**: 无

**请求示例**:

```http
DELETE /files/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deleted": true
  },
  "message": "文件删除成功"
}
```

### 4. 协议支持

#### 4.1 获取支持的协议

**接口地址**: `GET /files/protocols/supported`

**请求参数**: 无

**请求示例**:

```http
GET /files/protocols/supported
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "protocols": ["HTTP"],
    "count": 2,
    "details": {
      "HTTP": {
        "name": "HTTP协议",
        "description": "标准HTTP文件传输",
        "maxFileSize": 10485760,
        "supportedFeatures": ["单文件上传", "批量上传", "分块上传", "断点续传"]
      }
    }
  },
  "message": "获取支持的协议列表成功"
}
```

## 错误码说明

### 通用错误码

| 错误码         | HTTP状态码 | 描述           |
| -------------- | ---------- | -------------- |
| UNAUTHORIZED   | 401        | 未授权访问     |
| FORBIDDEN      | 403        | 禁止访问       |
| NOT_FOUND      | 404        | 资源不存在     |
| INTERNAL_ERROR | 500        | 服务器内部错误 |

### 文件相关错误码

| 错误码            | HTTP状态码 | 描述             |
| ----------------- | ---------- | ---------------- |
| FILE_TOO_LARGE    | 400        | 文件大小超出限制 |
| INVALID_FILE_TYPE | 400        | 不支持的文件类型 |
| FILE_NOT_FOUND    | 404        | 文件不存在       |
| UPLOAD_FAILED     | 500        | 文件上传失败     |
| DOWNLOAD_FAILED   | 500        | 文件下载失败     |
| STORAGE_ERROR     | 500        | 存储服务错误     |

### 分块上传错误码

| 错误码              | HTTP状态码 | 描述             |
| ------------------- | ---------- | ---------------- |
| INVALID_UPLOAD_ID   | 400        | 无效的上传ID     |
| UPLOAD_EXPIRED      | 400        | 上传会话已过期   |
| CHUNK_MISSING       | 400        | 分块缺失         |
| CHUNK_OUT_OF_RANGE  | 400        | 分块序号超出范围 |
| CHUNK_SIZE_MISMATCH | 400        | 分块大小不匹配   |

## 配置说明

### 环境变量

在 `.env.development` 或 `.env.production` 中配置：

```bash
# 文件上传基础配置
MAX_FILE_SIZE=10485760          # 最大文件大小 (10MB)
MAX_BATCH_FILES=10              # 批量上传最大文件数
UPLOAD_PATH=./uploads           # 本地存储路径
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,text/plain

# 分块上传配置
CHUNK_UPLOAD_TIMEOUT=3600       # 分块上传超时时间（秒）
DEFAULT_CHUNK_SIZE=1048576      # 默认分块大小 (1MB)


# 存储类型选择
STORAGE_TYPE=LOCAL              # LOCAL
```

### 文件类型配置

支持的文件类型：

```typescript
const ALLOWED_MIME_TYPES = {
  // 图片
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],

  // 文档
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],

  // 音频
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],

  // 视频
  'video/mp4': ['.mp4'],
  'video/avi': ['.avi'],
};
```

## 使用示例

### JavaScript/TypeScript 客户端

```typescript
class FileUploadClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  // 单文件上传
  async uploadFile(file: File, description?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await fetch(`${this.baseUrl}/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }

  // 批量文件上传
  async uploadFiles(files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseUrl}/files/upload/batch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }

  // 分块上传大文件
  async uploadLargeFile(file: File, onProgress?: (progress: number) => void): Promise<any> {
    const chunkSize = 1024 * 1024; // 1MB
    const totalChunks = Math.ceil(file.size / chunkSize);

    // 1. 初始化分块上传
    const initResponse = await fetch(`${this.baseUrl}/files/upload/chunk/init`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        fileSize: file.size,
        chunkSize,
        totalChunks,
        mimeType: file.type,
      }),
    });

    const {
      data: { uploadId },
    } = await initResponse.json();

    // 2. 上传分块
    const uploadedChunks: number[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('uploadId', uploadId);
      formData.append('chunkNumber', (i + 1).toString());
      formData.append('chunk', chunk);

      const chunkResponse = await fetch(`${this.baseUrl}/files/upload/chunk`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      });

      if (chunkResponse.ok) {
        uploadedChunks.push(i + 1);
        if (onProgress) {
          onProgress((uploadedChunks.length / totalChunks) * 100);
        }
      }
    }

    // 3. 完成上传
    const completeResponse = await fetch(`${this.baseUrl}/files/upload/chunk/complete`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadId,
        chunks: uploadedChunks,
      }),
    });

    return completeResponse.json();
  }

  // 获取文件列表
  async getFiles(
    params: {
      page?: number;
      limit?: number;
      type?: string;
      search?: string;
    } = {},
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/files?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    return response.json();
  }

  // 下载文件
  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/files/${fileId}/download`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    return response.blob();
  }

  // 删除文件
  async deleteFile(fileId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    return response.json();
  }
}

// 使用示例
const client = new FileUploadClient('http://localhost:8848', 'your-jwt-token');

// 上传单个文件
const file = document.getElementById('fileInput').files[0];
client.uploadFile(file, '这是一个测试文件').then((result) => {
  console.log('上传成功:', result);
});

// 上传大文件并显示进度
client
  .uploadLargeFile(file, (progress) => {
    console.log(`上传进度: ${progress.toFixed(2)}%`);
  })
  .then((result) => {
    console.log('大文件上传成功:', result);
  });
```

### cURL 示例

```bash
# 单文件上传
curl -X POST \
  http://localhost:8848/files/upload \
  -H "Authorization: Bearer your-jwt-token" \
  -F "file=@/path/to/your/file.pdf" \
  -F "description=测试文件"

# 获取文件列表
curl -X GET \
  "http://localhost:8848/files?page=1&limit=10&type=image" \
  -H "Authorization: Bearer your-jwt-token"

# 下载文件
curl -X GET \
  http://localhost:8848/files/550e8400-e29b-41d4-a716-446655440000/download \
  -H "Authorization: Bearer your-jwt-token" \
  -o downloaded-file.pdf

# 删除文件
curl -X DELETE \
  http://localhost:8848/files/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer your-jwt-token"
```

## 最佳实践

### 1. 文件上传策略

- **小文件（<10MB）**: 使用单文件上传或批量上传
- **大文件（>10MB）**: 使用分块上传，支持断点续传
- **批量文件**: 使用批量上传接口，最多10个文件

### 2. 错误处理

```typescript
try {
  const result = await client.uploadFile(file);
  console.log('上传成功:', result);
} catch (error) {
  if (error.code === 'FILE_TOO_LARGE') {
    console.error('文件太大，请选择小于10MB的文件');
  } else if (error.code === 'INVALID_FILE_TYPE') {
    console.error('不支持的文件类型');
  } else {
    console.error('上传失败:', error.message);
  }
}
```

### 3. 性能优化

- 使用分块上传处理大文件
- 实现上传进度显示
- 支持断点续传功能
- 合理设置分块大小（建议1MB）

### 4. 安全考虑

- 始终验证JWT Token
- 检查文件类型和大小
- 实现文件访问权限控制
- 定期清理过期的分块上传会话

---

**文档版本**: v1.0  
**最后更新**: 2024-01-01  
**维护团队**: NestJS开发团队

## 📚 API文档

启动开发服务器后，访问 Swagger 文档：

- **开发环境**: http://localhost:8848/api-docs
- **生产环境**: http://your-domain/api-docs

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

# 环境配置检查
pnpm run env:check
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

## 📦 生产部署

本项目提供了完整的生产部署方案，支持 Docker 和 PM2 两种部署方式。

### 🚀 快速部署

#### 环境要求

- **Docker 部署**：需要预装 Docker + Docker Compose
- **PM2 部署**：需要预装 Node.js + PM2 + MySQL

#### 一键部署

```bash
# 1. 配置环境
cp deployment/config/.env.production .env
# 编辑 .env 文件，修改数据库密码和 JWT 密钥

# 2. 执行一键部署
chmod +x deployment/scripts/quick-deploy.sh
./deployment/scripts/quick-deploy.sh
# 按提示选择部署方式

# 3. 访问应用
# http://your-server:3000
```

### 📖 完整部署指南

详细的部署文档请查看：**[deployment/README.md](deployment/README.md)**

**包含内容：**

- 🔧 **环境要求**：Docker/PM2 预装软件清单和安装命令
- 🚀 **一键部署**：自动化部署脚本使用指南
- 🐳 **Docker 部署**：容器化部署详细步骤
- 📦 **PM2 部署**：进程管理部署方案
- 🛡️ **安全配置**：防火墙、SSL证书、权限设置
- 📊 **运维管理**：服务监控、日志查看、重启操作
- 🔍 **故障排除**：常见问题解决方案
- ⚡ **性能优化**：系统调优和应用优化建议

## 📞 技术支持

如有问题，请：

1. 查看本README文档
2. 查看 `deployment/README.md` 详细部署文档
3. 运行 `pnpm run env:check` 检查配置
4. 提交Issue或联系开发团队

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

---

**开发团队** | **版本** v0.0.1 | **最后更新** 2025-08-30
