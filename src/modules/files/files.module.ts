import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as multer from 'multer';
import { File, UploadChunk } from './entities';
import { FilesController } from './files.controller';
import { FileAccessGuard } from './guards/file-access.guard';
import { ChunkService } from './services/chunk.service';
import { FilesService } from './services/files.service';
import { StorageFactoryService } from './services/storage-factory.service';
import { StorageService } from './services/storage.service';
import { ValidationService } from './services/validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([File, UploadChunk]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: multer.memoryStorage(),
        limits: {
          fileSize: configService.get('app.static.upload.maxFileSize', 10 * 1024 * 1024), // 10MB
          files: configService.get('app.static.upload.maxBatchFiles', 10),
        },
        fileFilter: (req, file, cb) => {
          const allowedTypes = configService.get<string[]>('app.static.upload.allowedTypes', []);
          if (allowedTypes.length === 0 || allowedTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
          }
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FilesController],
  providers: [
    FilesService,
    StorageService,
    ChunkService,
    ValidationService,
    FileAccessGuard,
    StorageFactoryService,
  ],
  exports: [FilesService, StorageService],
})
export class FilesModule {}
