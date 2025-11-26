import Joi from 'joi';
import { ImportExportService } from '../service';
import type { ExportConfig, ImportConfig } from '../types';

async function demo(): Promise<void> {
  const svc = new ImportExportService();

  const exportConfig: ExportConfig = {
    format: 'xlsx',
    headers: ['id', 'name', 'age'],
    mapping: { id: 'id', name: 'name', age: 'age' },
    sheetName: 'Users',
  };

  const exportData = [
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: 28 },
  ];

  const _res = await svc.exportToFile(exportData, exportConfig);
  // 将 res.buffer 作为下载响应体返回（Nest 控制器中使用 Response）

  const importConfig: ImportConfig = {
    format: 'csv',
    mapping: { id: '编号', name: '姓名', age: '年龄' },
    schema: Joi.object({
      id: Joi.number().required(),
      name: Joi.string().required(),
      age: Joi.number().min(0),
    }),
    chunkSize: 1000,
    onChunk: async (_chunk) => {
      // 在此处按块入库或处理
    },
    csv: { delimiter: ',' },
  };

  // 假设 fileBuffer 来自上传文件（Express.Multer.File.buffer）
  const fileBuffer = Buffer.from('编号,姓名,年龄\n1,Alice,30\n2,Bob,28', 'utf-8');
  const _imp = await svc.importFromFile(fileBuffer, importConfig);
  // imp.data 为完整数据（如配置了 onChunk 也会累积），imp.errors 为校验或解析错误
}

void demo();
