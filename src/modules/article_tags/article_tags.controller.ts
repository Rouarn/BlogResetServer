import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ArticleTagsService } from './article_tags.service';
import { ArticleTag } from './entities/article_tag.entity';
import { CreateArticleTagDto } from './dto/create-article_tag.dto';
import { UpdateArticleTagDto } from './dto/update-article_tag.dto';
import { QueryArticleTagDto } from './dto/query-article_tag.dto';
import { DeleteArticleTagDto } from './dto/delete-article_tag.dto';

@ApiTags('ArticleTags管理')
@ApiBearerAuth()
@Controller('article_tags')
export class ArticleTagsController {
  constructor(private readonly service: ArticleTagsService) {}

  @Post()
  @ApiOperation({ summary: '创建记录' })
  @ApiBody({ type: CreateArticleTagDto })
  @ApiResponse({ status: 201, type: ArticleTag })
  async create(@Body() dto: CreateArticleTagDto): Promise<void> {
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
        data: { type: 'array', items: { $ref: '#/components/schemas/ArticleTag' } },
        total: { type: 'number' },
      },
    },
  })
  async findAll(@Query() query: QueryArticleTagDto): Promise<{ data: ArticleTag[]; total: number }> {
    const { current, size } = query;
    return await this.service.findAll(current, size);
  }

  @Get(':articleId/:tagId')
  @ApiOperation({ summary: '查询单条' })
  @ApiParam({ name: 'articleId', description: '文章ID' })
  @ApiParam({ name: 'tagId', description: '标签ID' })
  @ApiResponse({ status: 200, type: ArticleTag })
  async findOne(
    @Param('articleId') articleId: string,
    @Param('tagId') tagId: string,
  ): Promise<ArticleTag> {
    return await this.service.findById(articleId, tagId);
  }

  @Patch(':articleId/:tagId')
  @ApiOperation({ summary: '修改单条' })
  @ApiParam({ name: 'articleId', description: '文章ID' })
  @ApiParam({ name: 'tagId', description: '标签ID' })
  @ApiBody({ type: UpdateArticleTagDto })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('articleId') articleId: string,
    @Param('tagId') tagId: string,
    @Body() dto: UpdateArticleTagDto,
  ): Promise<void> {
    return await this.service.update(articleId, tagId, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除记录' })
  @ApiBody({ type: DeleteArticleTagDto })
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
  async delete(@Body() dto: DeleteArticleTagDto): Promise<{ message: string; deletedCount: number }> {
    return await this.service.remove(dto);
  }
}
