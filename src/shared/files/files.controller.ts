import { CurrentUser, GetCurrentUser, Public } from '@/common/decorators';
import { FilesValidationPipe, FileValidationPipe } from '@/common/pipes';
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
import {
  BatchUploadResultDto,
  FileListResponseDto,
  FileQueryDto,
  FileUploadDto,
  UploadFileResultDto,
} from './dto';
import { FileAccessGuard } from './guards/file-access.guard';
import { BatchUploadResult, FileUploadResult } from './interfaces';
import { FilesService } from './services/files.service';
import { Status } from '@/common/enums';
import { File } from './entities';

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
          type: 'string',
          enum: Object.values(Status),
          default: Status.DISABLED,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '文件上传成功',
    type: UploadFileResultDto,
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
    return await this.filesService.uploadSingleFile(file, uploadDto, user?.userId);
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
          description: '要上传的文件列表',
        },
        description: {
          type: 'string',
          description: '文件描述',
        },
        isPublic: {
          type: 'string',
          enum: Object.values(Status),
          default: Status.DISABLED,
          description: '是否公开文件',
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '批量文件上传完成',
    type: BatchUploadResultDto,
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
    return await this.filesService.uploadMultipleFiles(files, uploadDto, user?.userId);
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
    return await this.filesService.findFiles(queryDto, user?.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文件详情' })
  @ApiParam({ name: 'id', description: '文件ID', example: 'uuid' })
  @ApiResponse({
    status: 200,
    description: '获取文件详情成功',
  })
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
    return await this.filesService.findFileById(id, user?.userId);
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
    const { file, buffer } = await this.filesService.getFileBuffer(id, user?.userId);

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      'Content-Length': buffer.length.toString(),
    });

    res.send(buffer);
  }

  @Get(':id/preview')
  @Public()
  @ApiOperation({ summary: '预览文件' })
  @ApiQuery({
    name: 'size',
    required: false,
    description: '图片尺寸，格式如 1920x1080',
    example: '1920x1080',
  })
  @ApiResponse({ status: 200, description: '文件预览成功' })
  @UseGuards(FileAccessGuard)
  async previewFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('size') size: string,
    @Res() res: Response,
    @GetCurrentUser() user?: CurrentUser,
  ): Promise<void> {
    const { file, buffer } = await this.filesService.getFileBuffer(id, user?.userId, size);

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
  @ApiResponse({
    status: 404,
    description: '文件不存在',
    type: 'object',
  })
  @ApiResponse({
    status: 403,
    description: '无权限删除',
    type: 'object',
  })
  @UseGuards(FileAccessGuard)
  async deleteFile(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser() user?: CurrentUser,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.filesService.deleteFile(id, user?.userId);
    return {
      success: true,
      message: '文件删除成功',
    };
  }

  @Post(':id/public-status')
  @ApiOperation({ summary: '更新文件公开状态' })
  @ApiParam({ name: 'id', description: '文件ID', example: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isPublic: {
          type: 'string',
          enum: Object.values(Status),
        },
      },
      required: ['isPublic'],
    },
  })
  @ApiResponse({ status: 200, description: '文件状态更新成功' })
  @ApiResponse({
    status: 404,
    description: '文件不存在',
    type: 'object',
  })
  @ApiResponse({
    status: 403,
    description: '无权限修改',
    type: 'object',
  })
  @UseGuards(FileAccessGuard)
  async updatePublicStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isPublic') isPublic: Status,
    @GetCurrentUser() user?: CurrentUser,
  ): Promise<File> {
    return await this.filesService.updateFilePublicStatus(id, isPublic, user?.userId);
  }
}
