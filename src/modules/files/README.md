# Files Module 文件管理模块

## 📋 模块概述

Files 模块是一个功能完整的文件管理系统，提供文件上传、下载、预览、删除等核心功能。支持单文件上传、批量上传和分块上传，具备完善的权限控制和安全验证机制。

## 🏗️ 模块结构

```
src/modules/files/
├── decorators/           # 装饰器
│   ├── file-permissions.decorator.ts  # 文件权限装饰器
│   └── index.ts
├── dto/                  # 数据传输对象
│   ├── file-query.dto.ts        # 文件查询 DTO
│   ├── file-upload.dto.ts       # 文件上传 DTO
│   ├── swagger-responses.dto.ts # Swagger 响应 DTO
│   └── index.ts
├── entities/             # 数据库实体
│   ├── file.entity.ts           # 文件实体
│   ├── upload-chunk.entity.ts   # 上传分块实体
│   └── index.ts
├── enums/                # 枚举定义
│   ├── file-status.enum.ts      # 文件状态枚举
│   ├── file-type.enum.ts        # 文件类型枚举
│   └── index.ts
├── guards/               # 守卫
│   └── file-access.guard.ts     # 文件访问守卫
├── interfaces/           # 接口定义
│   ├── file-upload.interface.ts # 文件上传接口
│   ├── storage.interface.ts     # 存储接口
│   └── index.ts
├── services/             # 服务层
│   ├── chunk.service.ts         # 分块上传服务
│   ├── files.service.ts         # 文件服务
│   ├── storage.service.ts       # 存储服务
│   ├── validation.service.ts    # 验证服务
│   └── storage-factory.service.ts # 存储工厂服务
├── files.controller.ts   # 控制器
├── files.module.ts       # 模块定义
└── README.md            # 本文档
```

## ✨ 功能特性

### 🔄 上传方式
- **单文件上传**: 支持单个文件直接上传
- **批量上传**: 支持多文件同时上传（最多10个）
- **分块上传**: 支持大文件分块上传，提高上传稳定性

### 🔒 安全特性
- **文件类型验证**: 支持 MIME 类型白名单控制
- **文件大小限制**: 可配置单文件和总文件大小限制
- **权限控制**: 支持公开/私有文件访问控制
- **哈希去重**: 基于文件哈希值避免重复存储

### 📁 文件管理
- **文件预览**: 支持在线预览（图片、文档等）
- **文件下载**: 支持文件下载功能
- **文件删除**: 支持文件删除（仅所有者）
- **文件查询**: 支持分页、搜索、筛选

## 🚀 快速开始

### 1. 模块导入

```typescript
import { Module } from '@nestjs/common';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    FilesModule,
    // 其他模块...
  ],
})
export class AppModule {}
```

### 2. 环境配置

在 `.env` 文件中配置文件上传相关参数：

```env
# 静态资源配置
STATIC_ROOT_PATH=./static
STATIC_URL_PREFIX=/static

# 上传配置
UPLOAD_MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_MAX_BATCH_FILES=10
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf
```

## 📚 API 接口

### 文件上传

#### 单文件上传
```http
POST /files/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "file": <binary>,
  "description": "文件描述",
  "isPublic": false
}
```

#### 批量文件上传
```http
POST /files/upload/batch
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "files": [<binary>, <binary>],
  "description": "批量上传",
  "isPublic": false
}
```

#### 分块上传初始化
```http
POST /files/upload/chunk/init
Content-Type: application/json
Authorization: Bearer <token>

{
  "filename": "large-file.zip",
  "fileSize": 104857600,
  "chunkSize": 1048576,
  "totalChunks": 100,
  "fileType": "ARCHIVE",
  "description": "大文件上传",
  "isPublic": false
}
```

#### 分块上传
```http
POST /files/upload/chunk
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "chunk": <binary>,
  "uploadId": "uuid",
  "chunkNumber": 1,
  "chunkHash": "hash-value"
}
```

#### 完成分块上传
```http
POST /files/upload/chunk/complete
Content-Type: application/json
Authorization: Bearer <token>

{
  "uploadId": "uuid",
  "chunks": [1, 2, 3, 4, 5]
}
```

### 文件查询

#### 获取文件列表
```http
GET /files?size=10&current=1&type=IMAGE&search=keyword
Authorization: Bearer <token>
```

#### 获取文件详情
```http
GET /files/:id
Authorization: Bearer <token>
```

### 文件操作

#### 下载文件
```http
GET /files/:id/download
Authorization: Bearer <token>
```

#### 预览文件
```http
GET /files/:id/preview
Authorization: Bearer <token>
```

#### 删除文件
```http
DELETE /files/:id
Authorization: Bearer <token>
```

## 💻 后端开发指南

### 1. 使用文件服务

```typescript
import { Injectable } from '@nestjs/common';
import { FilesService } from '../files/services/files.service';

@Injectable()
export class MyService {
  constructor(private readonly filesService: FilesService) {}

  async handleFileUpload(file: Express.Multer.File, userId: string) {
    const uploadDto = {
      description: '用户上传的文件',
      isPublic: false,
      protocol: 'HTTP'
    };
    
    const result = await this.filesService.uploadSingleFile(file, uploadDto, userId);
    return result;
  }

  async getUserFiles(userId: string) {
    const queryDto = {
      size: 10,
      current: 1,
      publicOnly: false
    };
    
    const files = await this.filesService.findFiles(queryDto, userId);
    return files;
  }
}
```

### 2. 自定义文件权限

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { RequirePermissions, FilePermission } from '../files/decorators';
import { FileAccessGuard } from '../files/guards/file-access.guard';

@Controller('admin/files')
@UseGuards(FileAccessGuard)
export class AdminFilesController {
  @Get()
  @RequirePermissions(FilePermission.ADMIN)
  async getAllFiles() {
    // 管理员查看所有文件
  }

  @Delete(':id')
  @RequirePermissions(FilePermission.DELETE)
  async deleteAnyFile() {
    // 管理员删除任意文件
  }
}
```

### 3. 扩展存储适配器

```typescript
import { Injectable } from '@nestjs/common';
import { StorageAdapter } from '../files/interfaces';

@Injectable()
export class S3StorageAdapter implements StorageAdapter {
  async upload(file: Express.Multer.File, path: string): Promise<string> {
    // 实现 S3 上传逻辑
    return 's3://bucket/path/to/file';
  }

  async download(path: string): Promise<Buffer> {
    // 实现 S3 下载逻辑
    return Buffer.from('file content');
  }

  async delete(path: string): Promise<boolean> {
    // 实现 S3 删除逻辑
    return true;
  }

  async exists(path: string): Promise<boolean> {
    // 检查文件是否存在
    return true;
  }
}
```

## 🌐 前端集成指南

### 1. 单文件上传

```typescript
// React 示例
import React, { useState } from 'react';
import axios from 'axios';

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', '用户上传');
    formData.append('isPublic', 'false');

    setUploading(true);
    try {
      const response = await axios.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('上传成功:', response.data);
    } catch (error) {
      console.error('上传失败:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? '上传中...' : '上传文件'}
      </button>
    </div>
  );
};
```

### 2. 分块上传

```typescript
// 大文件分块上传示例
class ChunkUploader {
  private chunkSize = 1024 * 1024; // 1MB

  async uploadLargeFile(file: File, onProgress?: (progress: number) => void) {
    const totalChunks = Math.ceil(file.size / this.chunkSize);
    
    // 1. 初始化分块上传
    const initResponse = await axios.post('/api/files/upload/chunk/init', {
      filename: file.name,
      fileSize: file.size,
      chunkSize: this.chunkSize,
      totalChunks,
      description: '大文件上传'
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const { uploadId } = initResponse.data;
    const uploadedChunks: number[] = [];

    // 2. 上传分块
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('uploadId', uploadId);
      formData.append('chunkNumber', (i + 1).toString());

      try {
        await axios.post('/api/files/upload/chunk', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        uploadedChunks.push(i + 1);
        onProgress?.(uploadedChunks.length / totalChunks * 100);
      } catch (error) {
        console.error(`分块 ${i + 1} 上传失败:`, error);
        throw error;
      }
    }

    // 3. 完成上传
    const completeResponse = await axios.post('/api/files/upload/chunk/complete', {
      uploadId,
      chunks: uploadedChunks
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    return completeResponse.data;
  }
}
```

### 3. 文件列表展示

```typescript
// Vue 3 示例
<template>
  <div>
    <div class="file-filters">
      <select v-model="filters.type">
        <option value="">所有类型</option>
        <option value="IMAGE">图片</option>
        <option value="VIDEO">视频</option>
        <option value="DOCUMENT">文档</option>
      </select>
      <input v-model="filters.search" placeholder="搜索文件..." />
    </div>
    
    <div class="file-list">
      <div v-for="file in files" :key="file.id" class="file-item">
        <img v-if="file.fileType === 'IMAGE'" :src="getPreviewUrl(file.id)" />
        <div class="file-info">
          <h4>{{ file.originalName }}</h4>
          <p>{{ formatFileSize(file.size) }}</p>
          <p>{{ formatDate(file.createTime) }}</p>
        </div>
        <div class="file-actions">
          <button @click="downloadFile(file.id)">下载</button>
          <button @click="deleteFile(file.id)" v-if="canDelete(file)">删除</button>
        </div>
      </div>
    </div>
    
    <div class="pagination">
      <button @click="prevPage" :disabled="pagination.current <= 1">上一页</button>
      <span>{{ pagination.current }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="pagination.current >= totalPages">下一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import axios from 'axios';

interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  fileType: string;
  createTime: string;
  userId: string;
}

const files = ref<FileItem[]>([]);
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

const filters = reactive({
  type: '',
  search: ''
});

const totalPages = computed(() => Math.ceil(pagination.total / pagination.size));

const loadFiles = async () => {
  try {
    const params = {
      current: pagination.current,
      size: pagination.size,
      type: filters.type || undefined,
      search: filters.search || undefined
    };
    
    const response = await axios.get('/api/files', {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    files.value = response.data.data;
    pagination.total = response.data.total;
  } catch (error) {
    console.error('加载文件列表失败:', error);
  }
};

const downloadFile = async (fileId: string) => {
  try {
    const response = await axios.get(`/api/files/${fileId}/download`, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'file';
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('下载失败:', error);
  }
};

const deleteFile = async (fileId: string) => {
  if (!confirm('确定要删除这个文件吗？')) return;
  
  try {
    await axios.delete(`/api/files/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    await loadFiles(); // 重新加载列表
  } catch (error) {
    console.error('删除失败:', error);
  }
};

const getPreviewUrl = (fileId: string) => `/api/files/${fileId}/preview`;

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

const canDelete = (file: FileItem) => {
  // 检查是否为文件所有者
  const currentUserId = localStorage.getItem('userId');
  return file.userId === currentUserId;
};

const prevPage = () => {
  if (pagination.current > 1) {
    pagination.current--;
  }
};

const nextPage = () => {
  if (pagination.current < totalPages.value) {
    pagination.current++;
  }
};

// 监听分页和筛选条件变化
watch([() => pagination.current, filters], loadFiles);

onMounted(loadFiles);
</script>
```

## 📊 数据模型

### 文件实体 (File Entity)

```typescript
export class File {
  id: string;                    // 文件ID (UUID)
  filename: string;              // 存储文件名
  originalName: string;          // 原始文件名
  mimeType: string;             // MIME类型
  size: number;                 // 文件大小（字节）
  path: string;                 // 存储路径
  hash: string;                 // 文件哈希值
  userId: string;               // 上传用户ID
  uploadProtocol: string;       // 上传协议
  status: FileStatus;           // 文件状态
  fileType: FileType;           // 文件类型
  uploadId: string;             // 上传ID（分块上传）
  totalChunks: number;          // 总分块数
  uploadedChunks: number;       // 已上传分块数
  description: string;          // 文件描述
  isPublic: boolean;            // 是否公开
  createTime: Date;             // 创建时间
  updateTime: Date;             // 更新时间
  deleteTime: Date;             // 删除时间
}
```

### 文件状态枚举

```typescript
export enum FileStatus {
  UPLOADING = 'UPLOADING',      // 上传中
  COMPLETED = 'COMPLETED',      // 上传完成
  FAILED = 'FAILED',           // 上传失败
  PROCESSING = 'PROCESSING',    // 处理中
  DELETED = 'DELETED'          // 已删除
}
```

### 文件类型枚举

```typescript
export enum FileType {
  IMAGE = 'IMAGE',             // 图片
  VIDEO = 'VIDEO',             // 视频
  AUDIO = 'AUDIO',             // 音频
  DOCUMENT = 'DOCUMENT',       // 文档
  ARCHIVE = 'ARCHIVE',         // 压缩包
  OTHER = 'OTHER'              // 其他
}
```

## 🔧 配置说明

### 应用配置

```typescript
// config/configuration.ts
export default () => ({
  app: {
    static: {
      // 静态资源根路径
      rootPath: process.env.STATIC_ROOT_PATH || './static',
      // 静态资源URL前缀
      urlPrefix: process.env.STATIC_URL_PREFIX || '/static',
      upload: {
        // 单文件最大大小（字节）
        maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE) || 10 * 1024 * 1024,
        // 批量上传最大文件数
        maxBatchFiles: parseInt(process.env.UPLOAD_MAX_BATCH_FILES) || 10,
        // 允许的文件类型
        allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || [],
      }
    }
  }
});
```

### 环境变量

```env
# 静态资源配置
STATIC_ROOT_PATH=./static
STATIC_URL_PREFIX=/static

# 上传限制
UPLOAD_MAX_FILE_SIZE=10485760
UPLOAD_MAX_BATCH_FILES=10
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=nestjs_app
```

## 🛡️ 安全考虑

### 1. 文件类型验证

```typescript
// 在 ValidationService 中实现
async validateFile(file: Express.Multer.File): Promise<void> {
  // 1. 检查文件扩展名
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    throw new BadRequestException('不支持的文件扩展名');
  }

  // 2. 验证 MIME 类型
  const detectedType = await fileTypeFromBuffer(file.buffer);
  if (detectedType && detectedType.mime !== file.mimetype) {
    throw new BadRequestException('文件类型与实际内容不匹配');
  }

  // 3. 检查文件头部签名
  const fileSignature = file.buffer.slice(0, 4).toString('hex');
  if (!this.isValidFileSignature(fileSignature, file.mimetype)) {
    throw new BadRequestException('无效的文件格式');
  }
}
```

### 2. 权限控制

```typescript
// 文件访问权限检查
private canAccessFile(file: File, userId?: string): boolean {
  // 公开文件任何人都可以访问
  if (file.isPublic) {
    return true;
  }

  // 私有文件只有所有者可以访问
  if (userId && file.userId === userId) {
    return true;
  }

  // 管理员可以访问所有文件
  if (this.isAdmin(userId)) {
    return true;
  }

  return false;
}
```

### 3. 文件路径安全

```typescript
// 防止路径遍历攻击
private sanitizePath(inputPath: string): string {
  // 移除危险字符
  const sanitized = inputPath.replace(/[<>:"|?*]/g, '');
  
  // 防止路径遍历
  const normalized = path.normalize(sanitized);
  if (normalized.includes('..')) {
    throw new BadRequestException('无效的文件路径');
  }
  
  return normalized;
}
```

## 🧪 测试

### 单元测试示例

```typescript
// files.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FilesService } from './files.service';
import { File } from '../entities/file.entity';

describe('FilesService', () => {
  let service: FilesService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: getRepositoryToken(File),
          useValue: mockRepository,
        },
        // 其他依赖...
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  describe('uploadSingleFile', () => {
    it('should upload file successfully', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const uploadDto = {
        description: 'Test file',
        isPublic: false,
      };

      mockRepository.findOne.mockResolvedValue(null); // 文件不存在
      mockRepository.create.mockReturnValue({ id: 'test-id' });
      mockRepository.save.mockResolvedValue({ id: 'test-id' });

      const result = await service.uploadSingleFile(mockFile, uploadDto, 'user-id');
      
      expect(result).toBeDefined();
      expect(result.fileId).toBe('test-id');
    });
  });
});
```

### 集成测试示例

```typescript
// files.controller.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('FilesController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 获取认证令牌
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'test', password: 'test' });
    
    authToken = loginResponse.body.accessToken;
  });

  describe('/files/upload (POST)', () => {
    it('should upload file successfully', () => {
      return request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test file content'), 'test.txt')
        .field('description', 'Test file')
        .field('isPublic', 'false')
        .expect(201)
        .expect((res) => {
          expect(res.body.fileId).toBeDefined();
          expect(res.body.filename).toBeDefined();
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## 🚀 性能优化

### 1. 文件缓存策略

```typescript
// 实现文件缓存
@Injectable()
export class FileCacheService {
  private cache = new Map<string, { buffer: Buffer; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟

  async getFile(fileId: string): Promise<Buffer | null> {
    const cached = this.cache.get(fileId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.buffer;
    }
    return null;
  }

  setFile(fileId: string, buffer: Buffer): void {
    this.cache.set(fileId, {
      buffer,
      timestamp: Date.now()
    });
  }
}
```

### 2. 数据库查询优化

```typescript
// 使用索引和分页优化查询
async findFiles(queryDto: FileQueryDto, userId?: string) {
  const queryBuilder = this.fileRepository
    .createQueryBuilder('file')
    .select([
      'file.id',
      'file.filename', 
      'file.originalName',
      'file.size',
      'file.mimeType',
      'file.fileType',
      'file.createTime'
    ]) // 只选择需要的字段
    .where('file.status = :status', { status: FileStatus.COMPLETED })
    .orderBy('file.createTime', 'DESC')
    .take(queryDto.size || 10)
    .skip(((queryDto.current || 1) - 1) * (queryDto.size || 10));

  // 添加索引：CREATE INDEX idx_files_status_create_time ON ra_files(status, create_time);
  
  return await queryBuilder.getManyAndCount();
}
```

## 🔍 故障排除

### 常见问题

1. **文件上传失败**
   - 检查文件大小是否超出限制
   - 验证文件类型是否在允许列表中
   - 确认存储路径是否有写入权限

2. **文件访问被拒绝**
   - 检查用户是否有访问权限
   - 验证文件是否为公开文件
   - 确认JWT令牌是否有效

3. **分块上传失败**
   - 检查分块顺序是否正确
   - 验证uploadId是否有效
   - 确认所有分块是否上传完成

### 日志监控

```typescript
// 添加详细的日志记录
@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  async uploadSingleFile(file: Express.Multer.File, uploadDto: FileUploadDto, userId?: string) {
    this.logger.log(`开始上传文件: ${file.originalname}, 大小: ${file.size} bytes, 用户: ${userId}`);
    
    try {
      const result = await this.processUpload(file, uploadDto, userId);
      this.logger.log(`文件上传成功: ${result.fileId}`);
      return result;
    } catch (error) {
      this.logger.error(`文件上传失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

## 📈 监控指标

建议监控以下指标：

- **上传成功率**: 成功上传数 / 总上传数
- **平均上传时间**: 文件上传耗时统计
- **存储空间使用**: 已使用存储空间 / 总存储空间
- **文件类型分布**: 各类型文件的数量统计
- **用户活跃度**: 各用户的文件操作频率

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

**注意**: 本文档会随着模块功能的更新而持续维护，请关注最新版本。