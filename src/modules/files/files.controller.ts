import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { FilesService } from './services/files.service';
import { ChunkService } from './services/chunk.service';
import {
  FileUploadDto,
  FileQueryDto,
  ChunkUploadInitDto,
  ChunkUploadDto,
  ChunkUploadCompleteDto,
} from './dto';
import {
  FileUploadSuccessResponse,
  BatchUploadSuccessResponse,
  ApiErrorResponse,
  FileListResponse,
} from './dto/swagger-responses.dto';
import { GetCurrentUser, CurrentUser } from 'src/common/decorators';
import { FileAccessGuard } from './guards/file-access.guard';
import { FileValidationPipe, FilesValidationPipe } from 'src/common/pipes';

@ApiTags('文件管理')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly chunkService: ChunkService,
  ) {}

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
    type: FileUploadSuccessResponse,
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    type: ApiErrorResponse,
  })
  @ApiResponse({
    status: 413,
    description: '文件大小超出限制',
    type: ApiErrorResponse,
  })
  @ApiResponse({
    status: 415,
    description: '不支持的文件类型',
    type: ApiErrorResponse,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(FileValidationPipe) file: any,
    @Body() uploadDto: FileUploadDto,
    @GetCurrentUser() user?: CurrentUser,
  ) {
    const result = await this.filesService.uploadSingleFile(
      file,
      uploadDto,
      user?.id,
    );
    return {
      success: true,
      data: result,
      message: '文件上传成功',
    };
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
    type: BatchUploadSuccessResponse,
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    type: ApiErrorResponse,
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadFiles(
    @UploadedFiles(FilesValidationPipe) files: any[],
    @Body() uploadDto: FileUploadDto,
    @GetCurrentUser() user?: CurrentUser,
  ) {
    const result = await this.filesService.uploadMultipleFiles(
      files,
      uploadDto,
      user?.id,
    );
    return {
      success: true,
      data: result,
      message: '批量文件上传完成',
    };
  }

  @Post('upload/chunk/init')
  @ApiOperation({ summary: '初始化分块上传' })
  @ApiResponse({ status: 201, description: '分块上传初始化成功' })
  async initChunkUpload(
    @Body() initDto: ChunkUploadInitDto,
    @GetCurrentUser() user?: CurrentUser,
  ) {
    const result = await this.chunkService.initChunkUpload(initDto, user?.id);
    return {
      success: true,
      data: result,
      message: '分块上传初始化成功',
    };
  }

  @Post('upload/chunk')
  @ApiOperation({ summary: '上传文件分块' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        chunk: {
          type: 'string',
          format: 'binary',
        },
        uploadId: {
          type: 'string',
        },
        chunkNumber: {
          type: 'number',
        },
        chunkHash: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '分块上传成功' })
  @UseInterceptors(FileInterceptor('chunk'))
  async uploadChunk(
    @UploadedFile() chunk: any,
    @Body() chunkDto: ChunkUploadDto,
  ) {
    const result = await this.chunkService.uploadChunk(chunk, chunkDto);
    return {
      success: true,
      data: result,
      message: '分块上传成功',
    };
  }

  @Post('upload/chunk/complete')
  @ApiOperation({ summary: '完成分块上传' })
  @ApiResponse({ status: 201, description: '分块上传完成' })
  async completeChunkUpload(@Body() completeDto: ChunkUploadCompleteDto) {
    const result = await this.chunkService.completeChunkUpload(completeDto);
    return {
      success: true,
      data: result,
      message: '分块上传完成',
    };
  }

  @Get('upload/progress/:uploadId')
  @ApiOperation({ summary: '获取上传进度' })
  @ApiResponse({ status: 200, description: '获取上传进度成功' })
  async getUploadProgress(@Param('uploadId') uploadId: string) {
    const result = await this.chunkService.getUploadProgress(uploadId);
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: '获取文件列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '每页数量',
    example: 10,
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
    type: FileListResponse,
  })
  async getFiles(
    @Query() queryDto: FileQueryDto,
    @GetCurrentUser() user?: CurrentUser,
  ) {
    const { files, total } = await this.filesService.findFiles(
      queryDto,
      user?.id,
    );
    return {
      success: true,
      data: {
        files,
        pagination: {
          page: queryDto.page,
          limit: queryDto.limit,
          total,
          totalPages: Math.ceil(total / (queryDto.limit || 10)),
        },
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文件详情' })
  @ApiParam({ name: 'id', description: '文件ID', example: 'uuid' })
  @ApiResponse({ status: 200, description: '获取文件详情成功' })
  @ApiResponse({
    status: 404,
    description: '文件不存在',
    type: ApiErrorResponse,
  })
  @ApiResponse({
    status: 403,
    description: '无权限访问',
    type: ApiErrorResponse,
  })
  @UseGuards(FileAccessGuard)
  async getFile(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser() user?: CurrentUser,
  ) {
    const file = await this.filesService.findFileById(id, user?.id);
    return {
      success: true,
      data: file,
    };
  }

  @Get(':id/download')
  @ApiOperation({ summary: '下载文件' })
  @ApiResponse({ status: 200, description: '文件下载成功' })
  @UseGuards(FileAccessGuard)
  async downloadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @GetCurrentUser() user?: CurrentUser,
  ) {
    const { file, buffer } = await this.filesService.getFileBuffer(
      id,
      user?.id,
    );

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
  ) {
    const { file, buffer } = await this.filesService.getFileBuffer(
      id,
      user?.id,
    );

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
  ) {
    await this.filesService.deleteFile(id, user?.id);
    return {
      success: true,
      message: '文件删除成功',
    };
  }
}
