# 文件管理模块 API 文档

## 概述

本文档描述了NestJS文件管理模块的完整API接口，支持多协议文件传输、分块上传、断点续传等高级功能。

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **内容类型**: `application/json` 或 `multipart/form-data`

## 认证

所有API接口都需要在请求头中包含JWT令牌：

```http
Authorization: Bearer <your_jwt_token>
```

## 错误响应格式

所有错误响应都遵循统一格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": null
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/files/upload"
}
```

### 常见错误码

| 错误码 | HTTP状态码 | 描述 |
|--------|------------|------|
| `FILE_TOO_LARGE` | 413 | 文件大小超出限制 |
| `UNSUPPORTED_FILE_TYPE` | 415 | 不支持的文件类型 |
| `FILE_NOT_FOUND` | 404 | 文件不存在 |
| `ACCESS_DENIED` | 403 | 无权限访问 |
| `VALIDATION_ERROR` | 422 | 参数验证失败 |

## API 接口

### 1. 文件上传

#### 1.1 单文件上传

**接口**: `POST /files/upload`

**请求格式**: `multipart/form-data`

**参数**:
- `file` (required): 要上传的文件
- `description` (optional): 文件描述
- `isPublic` (optional): 是否公开，默认false
- `protocol` (optional): 上传协议，HTTP或FTP，默认HTTP

**示例**:
```bash
curl -X POST \
  http://localhost:3000/api/files/upload \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -F 'file=@example.pdf' \
  -F 'description=测试文件' \
  -F 'isPublic=false' \
  -F 'protocol=HTTP'
```

**响应**:
```json
{
  "success": true,
  "data": {
    "fileId": "uuid",
    "filename": "example_123456.pdf",
    "originalName": "example.pdf",
    "size": 1048576,
    "mimeType": "application/pdf",
    "path": "2024-01/example_123456.pdf",
    "hash": "sha256hash",
    "downloadUrl": "http://localhost:3000/api/files/uuid/download"
  },
  "message": "文件上传成功",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 1.2 批量文件上传

**接口**: `POST /files/upload/batch`

**请求格式**: `multipart/form-data`

**参数**:
- `files` (required): 要上传的文件数组（最多10个）
- `description` (optional): 文件描述
- `isPublic` (optional): 是否公开，默认false

**示例**:
```bash
curl -X POST \
  http://localhost:3000/api/files/upload/batch \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -F 'files=@file1.pdf' \
  -F 'files=@file2.jpg' \
  -F 'description=批量上传测试'
```

### 2. 分块上传

#### 2.1 初始化分块上传

**接口**: `POST /files/upload/chunk/init`

**参数**:
```json
{
  "filename": "large_file.zip",
  "fileSize": 104857600,
  "chunkSize": 1048576,
  "totalChunks": 100,
  "fileType": "ARCHIVE",
  "description": "大文件上传",
  "isPublic": false
}
```

#### 2.2 上传分块

**接口**: `POST /files/upload/chunk`

**请求格式**: `multipart/form-data`

**参数**:
- `chunk` (required): 分块数据
- `uploadId` (required): 上传ID
- `chunkNumber` (required): 分块序号
- `chunkHash` (optional): 分块哈希值

#### 2.3 完成分块上传

**接口**: `POST /files/upload/chunk/complete`

**参数**:
```json
{
  "uploadId": "uuid",
  "chunks": [1, 2, 3, 4, 5]
}
```

### 3. 文件管理

#### 3.1 获取文件列表

**接口**: `GET /files`

**查询参数**:
- `page`: 页码，默认1
- `limit`: 每页数量，默认10，最大100
- `type`: 文件类型筛选
- `status`: 文件状态筛选
- `search`: 搜索关键词
- `publicOnly`: 是否只显示公开文件
- `sortBy`: 排序字段
- `sortOrder`: 排序方向

**示例**:
```bash
curl -X GET \
  'http://localhost:3000/api/files?page=1&limit=10&type=IMAGE' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

#### 3.2 获取文件详情

**接口**: `GET /files/:id`

**示例**:
```bash
curl -X GET \
  http://localhost:3000/api/files/uuid \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

#### 3.3 下载文件

**接口**: `GET /files/:id/download`

**示例**:
```bash
curl -X GET \
  http://localhost:3000/api/files/uuid/download \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --output downloaded_file.pdf
```

#### 3.4 预览文件

**接口**: `GET /files/:id/preview`

**示例**:
```bash
curl -X GET \
  http://localhost:3000/api/files/uuid/preview \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

#### 3.5 删除文件

**接口**: `DELETE /files/:id`

**示例**:
```bash
curl -X DELETE \
  http://localhost:3000/api/files/uuid \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### 4. 协议支持

#### 4.1 获取支持的协议

**接口**: `GET /files/protocols/supported`

**响应**:
```json
{
  "success": true,
  "data": {
    "protocols": ["HTTP", "FTP"],
    "count": 2
  },
  "message": "获取支持的协议列表成功"
}
```

## 配置说明

### 环境变量

```env
# 基础配置
STORAGE_TYPE=local
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
MAX_BATCH_FILES=10
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf

# FTP配置
FTP_HOST=ftp.example.com
FTP_PORT=21
FTP_USER=username
FTP_PASSWORD=password
FTP_SECURE=false
FTP_BASE_PATH=/uploads

# AWS S3配置
AWS_REGION=us-east-1
AWS_S3_BUCKET=my-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## 权限控制

- **文件上传**: 需要登录用户
- **文件列表**: 显示用户自己的文件和公开文件
- **文件详情**: 只能查看自己的文件或公开文件
- **文件下载/预览**: 只能访问自己的文件或公开文件
- **文件删除**: 只能删除自己的文件

## 限制说明

- 单文件最大大小: 10MB（可配置）
- 批量上传最大文件数: 10个（可配置）
- 支持的文件类型: 可通过环境变量配置
- 分块上传最大分块数: 1000个

## SDK示例

### JavaScript/TypeScript

```typescript
class FileUploadClient {
  constructor(private baseUrl: string, private token: string) {}

  async uploadFile(file: File, options?: {
    description?: string;
    isPublic?: boolean;
    protocol?: 'HTTP' | 'FTP';
  }) {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.description) formData.append('description', options.description);
    if (options?.isPublic) formData.append('isPublic', String(options.isPublic));
    if (options?.protocol) formData.append('protocol', options.protocol);

    const response = await fetch(`${this.baseUrl}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/files/${fileId}/download`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    return response.blob();
  }
}
```

## 故障排除

### 常见问题

1. **文件上传失败**
   - 检查文件大小是否超出限制
   - 检查文件类型是否被允许
   - 检查JWT令牌是否有效

2. **FTP上传失败**
   - 检查FTP服务器连接配置
   - 检查用户名和密码
   - 检查网络连接

3. **分块上传失败**
   - 检查分块顺序是否正确
   - 检查分块哈希值是否匹配
   - 检查上传ID是否有效

### 日志查看

应用程序会记录详细的操作日志，包括：
- 文件上传/下载操作
- 错误信息和堆栈跟踪
- 性能指标

查看日志以获取更多故障排除信息。