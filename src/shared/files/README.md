# 文件上传与管理模块（src/shared/files）

本模块提供通用的文件上传、存储、访问控制与列表查询功能，开箱即用地支持本地文件系统存储、Multer 内存上传、Swagger 文档集成与权限校验。

## 功能概览

- 支持单文件与批量上传（`multipart/form-data`）
- 本地存储，自动按年月路径分组（`YYYY-MM/`），文件名唯一且可溯源
- 自动校验大小、类型，使用 `file-type` 做内容一致性验证
- 通过 SHA-256 去重：同内容文件只存一份，直接返回已有记录
- 公开/私有文件访问控制：公开可任意访问，私有仅所有者可读删
- 列表分页、类型筛选、关键词搜索、排序（创建时间/大小/文件名）
- Swagger 注解完善；所有上传/下载接口可在文档中直接调试

## 目录结构

- `files.module.ts` 模块注册：Multer、TypeORM、Providers
- `files.controller.ts` 路由控制器：上传、查询、下载、预览、删除
- `services/` 核心服务：
  - `files.service.ts` 业务流程与权限
  - `storage.service.ts` 本地存储适配器（读/写/删/URL 构造）
  - `validation.service.ts` 大小/类型校验、哈希/文件名生成
  - `storage-factory.service.ts` 存储工厂（当前仅本地）
- `guards/file-access.guard.ts` 文件访问权限校验
- `entities/file.entity.ts` 文件表结构
- `dto/` 上传与查询参数、Swagger响应模型
- `interfaces/` 上传结果、存储适配器等接口定义

## 快速集成

- 引入模块：在需要的模块中 `imports: [FilesModule]`（或直接在全局 `AppModule` 中引入）
- 数据库：`entities/file.entity.ts` 使用 TypeORM，表名 `files`
- 静态资源：应用需启用静态资源服务以暴露上传目录
- 认证：接口标注 `ApiBearerAuth`，默认通过 `Authorization: Bearer <token>` 传递用户身份

## 关键配置

模块读取两种配置来源，建议按环境变量统一配置：

- 静态资源与上传相关（`AppConfigService.staticAssetsOptions`）：
  - `NEST_STATIC_ASSETS_DIR` 静态资源根目录，默认 `./static`
  - `NEST_STATIC_ASSETS_PREFIX` 静态资源前缀，默认 `/static`
  - `NEST_STATIC_UPLOAD_PATH` 上传目录（相对静态根），默认 `./static/uploads`
  - `NEST_UPLOAD_MAX_SIZE` 最大文件大小，默认 `10485760`（10MB）
  - `NEST_UPLOAD_ALLOWED_TYPES` 允许类型，逗号分隔，默认空（不限制）
  - `NEST_UPLOAD_MAX_FILES` 批量上传最大文件数，默认 `10`
- 配置工厂（`configuration.ts` 的 `app.static` 命名空间）：
  - `uploadsPath`、`uploadsMaxSize`、`uploadsAllowedTypes`
  - `uploadsMaxBatchFiles`（批量上传最大文件数）

说明：

- `files.module.ts` 使用 Multer 内存存储，并读取 `uploadsMaxSize`、`uploadsMaxFiles` 与 `uploadsAllowedTypes`
- `storage.service.ts` 自动创建上传目录；所有文件写入 `staticAssetsOptions.options.uploadsPath`
- `storage.service.ts#getUrl` 根据 `baseUrl + prefix + uploadsPath + relativePath` 生成下载地址

## API 设计

- `POST /files/upload` 单文件上传
  - 表单字段：`file`（二进制）、`description?: string`、`isPublic?: boolean`、`protocol?: string=HTTP`
  - 响应：`{ fileId, filename, originalName, size, mimeType, path, hash, downloadUrl }`
  - 错误：`400` 参数错误，`413` 超出大小，`415` 不支持类型
- `POST /files/upload/batch` 批量上传（最多 10 个，受配置约束）
  - 表单字段：`files[]`、`description?`、`isPublic?`
  - 响应：`{ successful: FileUploadResult[], failed: { filename, error }[], totalFiles, successCount, failureCount }`
- `GET /files` 文件列表
  - 查询：`size?=10`、`current?=1`、`type?`（IMAGE/VIDEO/AUDIO/DOCUMENT/ARCHIVE/OTHER）、`search?`、`publicOnly?`、`sortBy?`、`sortOrder?`
  - 响应：`{ data: File[], total }`
- `GET /files/:id` 文件详情（权限校验）
- `GET /files/:id/download` 下载（权限校验，`Content-Disposition: attachment`）
- `GET /files/:id/preview` 预览（权限校验，`Content-Disposition: inline`）
- `DELETE /files/:id` 删除（仅文件所有者可删）

## 访问控制

- `guards/file-access.guard.ts`：
  - 若文件为公开（`isPublic=true`），任何人可访问
  - 若文件为私有，仅 `userId === 当前用户ID` 可访问
- 删除操作：仅所有者可删除；删除包括物理文件与数据库记录（物理文件失败不会阻断记录删除）

## 校验与去重

- 大小与类型：`validation.service.ts#validateFile` 会校验大小、MIME 与允许列表
- 内容一致性：使用 `file-type` 检测二进制内容类型与上传的 `mimetype` 是否一致
- 去重策略：`sha256(buffer)` 比对数据库 `hash` 字段，命中直接返回已有记录，避免重复存储
- 文件名生成：`<timestamp>_<random>.ext`，并按 `YYYY-MM/` 子目录归档

## 存储策略与路径

- 相对路径：`formatDatePath() + uniqueFilename`，例如 `2025-12/1734040000_abcd1234.png`
- 物理存储：拼接静态根与上传子目录后写入磁盘
- URL 构造：`baseUrl + staticPrefix + uploadsPathRelative + '/' + relativePath`
  - 例如：`http://localhost:3000/static/uploads/2025-12/1734040000_abcd1234.png`

## 数据库结构（`entities/file.entity.ts`）

- 核心字段：`id(uuid)`、`filename`、`originalName`、`mimeType`、`size(bigint)`、`path`、`hash(unique)`、`userId`、`uploadProtocol`、`fileType(enum)`、`description`、`isPublic`
- 继承：`BaseEntity`（包含 `createTime/updateTime/deleteTime` 等通用字段）

## 典型用例

- 单文件上传示例（需要 Bearer token）：
  - `curl -X POST http://localhost:3000/api/v1/files/upload -H "Authorization: Bearer <token>" -F "file=@./avatar.png" -F "description=头像" -F "isPublic=true"`
- 批量上传示例：
  - `curl -X POST http://localhost:3000/api/v1/files/upload/batch -H "Authorization: Bearer <token>" -F "files=@./a.png" -F "files=@./b.pdf" -F "description=批量"`
- 下载示例：
  - `curl -L -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/files/<id>/download -o output.bin`
- 列表查询示例（公开文件）：
  - `curl "http://localhost:3000/api/v1/files?publicOnly=true&size=20&current=1&sortBy=createTime&sortOrder=DESC"`

## 错误与返回

- 典型错误码：`400` 参数错误、`403` 无权限、`404` 不存在、`413` 过大、`415` 类型不支持
- 错误来源：`BusinessExceptionFactory.*` 统一创建业务异常与消息体

## Swagger 文档

- 所有接口已用 `@ApiOperation/@ApiResponse/@ApiConsumes/@ApiBody` 注解
- 开发环境默认启用 Swagger；访问前缀由 `NEST_SWAGGER_PREFIX` 控制（默认 `/api-docs`）
- 在文档页面可直接上传测试并查看返回的下载地址

## 扩展指南

- 新增存储类型：实现 `StorageAdapter` 接口并在 `storage-factory.service.ts` 注册
- 增强类型识别：调整 `validation.service.ts#allowedMimeTypes` 或结合内容指纹策略
- 增加病毒扫描/内容审核：在 `files.service.ts#uploadSingleFile` 生成哈希后插入安全扫描流程

## 常见问题

- “为什么上传失败/类型不支持？”
  - 检查 `NEST_UPLOAD_ALLOWED_TYPES` 是否包含该 `mimetype`（逗号分隔）
  - 如需不限制类型，留空或删除该环境变量
- “批量上传提示数量超限？”
  - 调整 `NEST_UPLOAD_MAX_FILES`（或 `NEST_UPLOAD_MAX_BATCH_FILES`）至合适数值
- “下载地址不正确或 404？”
  - 检查静态资源服务是否对 `uploadsPath` 做了正确映射，确认 `baseUrl/prefix/uploadsPath` 与实际磁盘路径一致

## 维护建议

- 统一通过环境变量管理大小、类型、上传目录等参数
- 生产环境建议开启类型白名单并限制最大大小
- 重要文件建议开启私有并配合鉴权网关与审计日志
