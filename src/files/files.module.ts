import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { File, UploadChunk } from './entities';
import { FilesController } from './controllers/files.controller';
import { FilesService } from './services/files.service';
import { StorageService } from './services/storage.service';
import { ChunkService } from './services/chunk.service';
import { ValidationService } from './services/validation.service';
import { FileAccessGuard } from './guards/file-access.guard';
import { ProtocolsController } from './controllers/protocols.controller';
import { StorageFactoryService } from './services/storage-factory.service';
import { MultiProtocolService } from './services/multi-protocol.service';
import { FileExceptionFilter } from './filters/file-exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import * as multer from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([File, UploadChunk]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: multer.memoryStorage(),
        limits: {
          fileSize: configService.get('MAX_FILE_SIZE', 10 * 1024 * 1024), // 10MB
          files: configService.get('MAX_BATCH_FILES', 10),
        },
        fileFilter: (req, file, cb) => {
          const allowedTypes = configService.get<string[]>('ALLOWED_FILE_TYPES', []);
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
  controllers: [FilesController, ProtocolsController],
  providers: [
    FilesService,
    StorageService,
    ChunkService,
    ValidationService,
    FileAccessGuard,
    StorageFactoryService,
    MultiProtocolService,
    {
      provide: APP_FILTER,
      useClass: FileExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  exports: [FilesService, StorageService],
})
export class FilesModule {}
