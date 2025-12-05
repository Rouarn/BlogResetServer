import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ArticleFilesService } from './article_files.service';
import { ArticleFile } from './entities/article_file.entity';
import { CreateArticleFileDto } from './dto/create-article_file.dto';
import { UpdateArticleFileDto } from './dto/update-article_file.dto';
import { QueryArticleFileDto } from './dto/query-article_file.dto';
import { DeleteArticleFileDto } from './dto/delete-article_file.dto';

@ApiTags('ArticleFiles管理')
@ApiBearerAuth()
@Controller('article_files')
export class ArticleFilesController {
  constructor(private readonly service: ArticleFilesService) {}

  @Post()
  @ApiOperation({ summary: '创建记录' })
  @ApiBody({ type: CreateArticleFileDto })
  @ApiResponse({ status: 201, type: ArticleFile })
  async create(@Body() dto: CreateArticleFileDto): Promise<void> {
    return await this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询全表' })
  @ApiQuery({ name: 'current', required: false, description: '当前页码', example: 1 })
  @ApiQuery({ name: 'size', required: false, description: '每页数量', example: 10 })
  @ApiResponse({
    status: 200,
    description: '获取列表成功',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/ArticleFile' } },
        total: { type: 'number' },
      },
    },
  })
  async findAll(@Query() query: QueryArticleFileDto): Promise<{ data: ArticleFile[]; total: number }> {
    const { current, size } = query;
    return await this.service.findAll(current, size);
  }

  @Get(':articleId/:fileId')
  @ApiOperation({ summary: '查询单条' })
  @ApiParam({ name: 'articleId', description: '文章ID' })
  @ApiParam({ name: 'fileId', description: '文件ID' })
  @ApiResponse({ status: 200, type: ArticleFile })
  async findOne(
    @Param('articleId') articleId: string,
    @Param('fileId') fileId: string,
  ): Promise<ArticleFile> {
    return await this.service.findById(articleId, fileId);
  }

  @Patch(':articleId/:fileId')
  @ApiOperation({ summary: '修改单条' })
  @ApiParam({ name: 'articleId', description: '文章ID' })
  @ApiParam({ name: 'fileId', description: '文件ID' })
  @ApiBody({ type: UpdateArticleFileDto })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('articleId') articleId: string,
    @Param('fileId') fileId: string,
    @Body() dto: UpdateArticleFileDto,
  ): Promise<void> {
    return await this.service.update(articleId, fileId, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除记录' })
  @ApiBody({ type: DeleteArticleFileDto })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        deletedCount: { type: 'number' },
      },
    },
  })
  async delete(@Body() dto: DeleteArticleFileDto): Promise<{ message: string; deletedCount: number }> {
    return await this.service.remove(dto);
  }
}
