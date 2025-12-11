import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { GetCurrentUser } from 'src/common/decorators';
import { FileValidationPipe, FilesValidationPipe } from 'src/common/pipes';
import type { Auth as CurrentUser } from 'src/modules/auth/entities/auth.entity';
import { FileQueryDto, FileUploadDto } from './dto';
import { FileListResponseDto, FileUploadResponseDto } from './dto/swagger-responses.dto';
import { FileAccessGuard } from './guards/file-access.guard';
import { BatchUploadResult, FileUploadResult } from './interfaces';
import { FilesService } from './services/files.service';

@ApiTags('文件管理')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: '单文件上传' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        description: {
          type: 'string',
        },
        isPublic: {
          type: 'boolean',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '文件上传成功',
    type: FileUploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    type: 'object',
  })
  @ApiResponse({
    status: 413,
    description: '文件大小超出限制',
    type: 'object',
  })
  @ApiResponse({
    status: 415,
    description: '不支持的文件类型',
    type: 'object',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
    @Body() uploadDto: FileUploadDto,
    @GetCurrentUser() user?: CurrentUser,
  ): Promise<FileUploadResult> {
    const result = await this.filesService.uploadSingleFile(file, uploadDto, user?.id);
    return result;
  }

  @Post('upload/batch')
  @ApiOperation({ summary: '批量文件上传' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        description: {
          type: 'string',
        },
        isPublic: {
          type: 'boolean',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '批量文件上传完成',
    type: 'object',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    type: 'object',
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadFiles(
    @UploadedFiles(FilesValidationPipe) files: Express.Multer.File[],
    @Body() uploadDto: FileUploadDto,
    @GetCurrentUser() user?: CurrentUser,
  ): Promise<BatchUploadResult> {
    const result = await this.filesService.uploadMultipleFiles(files, uploadDto, user?.id);
    return result;
  }

  @Get()
  @ApiOperation({ summary: '获取文件列表' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量', example: 10 })
  @ApiQuery({
    name: 'current',
    required: false,
    description: '页码',
    example: 1,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: '文件类型',
    enum: ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'ARCHIVE', 'OTHER'],
  })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  @ApiResponse({
    status: 200,
    description: '获取文件列表成功',
    type: FileListResponseDto,
  })
  async getFiles(
    @Query() queryDto: FileQueryDto,
    @GetCurrentUser() user?: CurrentUser,
  ): Promise<unknown> {
    const result = await this.filesService.findFiles(queryDto, user?.id);
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文件详情' })
  @ApiParam({ name: 'id', description: '文件ID', example: 'uuid' })
  @ApiResponse({ status: 200, description: '获取文件详情成功' })
  @ApiResponse({
    status: 404,
    description: '文件不存在',
    type: 'object',
  })
  @ApiResponse({
    status: 403,
    description: '无权限访问',
    type: 'object',
  })
  @UseGuards(FileAccessGuard)
  async getFile(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser() user?: CurrentUser,
  ): Promise<unknown> {
    const file = await this.filesService.findFileById(id, user?.id);
    return file;
  }

  @Get(':id/download')
  @ApiOperation({ summary: '下载文件' })
  @ApiResponse({ status: 200, description: '文件下载成功' })
  @UseGuards(FileAccessGuard)
  async downloadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @GetCurrentUser() user?: CurrentUser,
  ): Promise<void> {
    const { file, buffer } = await this.filesService.getFileBuffer(id, user?.id);

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      'Content-Length': buffer.length.toString(),
    });

    res.send(buffer);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: '预览文件' })
  @ApiResponse({ status: 200, description: '文件预览成功' })
  @UseGuards(FileAccessGuard)
  async previewFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @GetCurrentUser() user?: CurrentUser,
  ): Promise<void> {
    const { file, buffer } = await this.filesService.getFileBuffer(id, user?.id);

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
      'Content-Length': buffer.length.toString(),
    });

    res.send(buffer);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文件' })
  @ApiResponse({ status: 200, description: '文件删除成功' })
  async deleteFile(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser() user?: CurrentUser,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.filesService.deleteFile(id, user?.id);
    return {
      success: true,
      message: '文件删除成功',
    };
  }
}
