import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as multer from 'multer';
import { File } from './entities';
import { FilesController } from './files.controller';
import { FileAccessGuard } from './guards/file-access.guard';
import { FilesService } from './services/files.service';
import { StorageFactoryService } from './services/storage-factory.service';
import { StorageService } from './services/storage.service';
import { ValidationService } from './services/validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([File]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: multer.memoryStorage(),
        limits: {
          fileSize: configService.get('app.static.options.uploadsMaxSize', 10 * 1024 * 1024), // 10MB
          files: configService.get('app.static.options.uploadsMaxFiles', 10), // 同时上传文件数量
        },
        fileFilter: (req, file, cb) => {
          const allowedTypes = configService.get<string[]>(
            'app.static.options.uploadsAllowedTypes',
            [],
          );
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
    ValidationService,
    FileAccessGuard,
    StorageFactoryService,
  ],
  exports: [FilesService, StorageService],
})
export class FilesModule {}
