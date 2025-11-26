# 通用表格数据导入导出模块

## 特性

- 支持 `Excel(.xlsx)`、`CSV(.csv)`、`JSON(.json)` 导入与导出
- 统一服务类 API：`exportToFile`、`importFromFile`、`handleImportError`
- 自定义字段映射配置与可选转换函数
- 基于 `Joi` 的数据校验
- 大数据量分块处理与按块回调

## 安装

- 依赖：`xlsx`（Excel 解析与导出）、`joi`（校验）

## 类型与配置

- `ImportConfig` 支持 `format`、`mapping`、`transform`、`schema`、`chunkSize`、`sheetName`、`csv`、`json`、`onChunk`
- `ExportConfig` 支持 `format`、`mapping`、`headers`、`chunkSize`、`sheetName`、`fileName`、`csv`、`json`
- `FileLike` 支持 `Buffer | string(路径) | { buffer: Buffer, originalname?: string }`

## 使用示例

详见 `examples/import-export-usage.example.ts`

## 在 NestJS 中使用

- 直接在需要的模块中 `new ImportExportService()` 或作为提供者注入使用
- 上传文件场景下可将 `Express.Multer.File` 的 `buffer` 传入 `importFromFile`

## 字段映射说明

- `mapping` 为内部字段到源字段的映射：`{ internal: '源字段名' }`
- 导入时根据映射生成内部对象；导出时根据映射生成外部表头

## 校验

- 通过 `schema: Joi.object({...})` 配置，开启字段校验；校验错误会在返回结果的 `errors` 字段中体现

## 分块处理

- 设置 `chunkSize` 与 `onChunk`，即可在导入过程中对数据进行按块处理，适合大数据场景

## 接口

- `exportToFile(data: any[], config: ExportConfig): Promise<ExportResult>`
- `importFromFile(file: FileLike, config: ImportConfig): Promise<ImportResult>`
- `handleImportError(error: Error): ImportError`
