import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ArticleCategoriesService } from './article_categories.service';
import { ArticleCategory } from './entities/article_category.entity';
import { CreateArticleCategoryDto } from './dto/create-article_category.dto';
import { UpdateArticleCategoryDto } from './dto/update-article_category.dto';
import { QueryArticleCategoryDto } from './dto/query-article_category.dto';
import { DeleteArticleCategoryDto } from './dto/delete-article_category.dto';

@ApiTags('ArticleCategories管理')
@ApiBearerAuth()
@Controller('article_categories')
export class ArticleCategoriesController {
  constructor(private readonly service: ArticleCategoriesService) {}

  @Post()
  @ApiOperation({ summary: '创建记录' })
  @ApiBody({ type: CreateArticleCategoryDto })
  @ApiResponse({ status: 201, type: ArticleCategory })
  async create(@Body() dto: CreateArticleCategoryDto): Promise<void> {
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
        data: { type: 'array', items: { $ref: '#/components/schemas/ArticleCategory' } },
        total: { type: 'number' },
      },
    },
  })
  async findAll(@Query() query: QueryArticleCategoryDto): Promise<{ data: ArticleCategory[]; total: number }> {
    const { current, size } = query;
    return await this.service.findAll(current, size);
  }

  @Get(':articleId/:categoryId')
  @ApiOperation({ summary: '查询单条' })
  @ApiParam({ name: 'articleId', description: '文章ID' })
  @ApiParam({ name: 'categoryId', description: '分类ID' })
  @ApiResponse({ status: 200, type: ArticleCategory })
  async findOne(
    @Param('articleId') articleId: string,
    @Param('categoryId') categoryId: string,
  ): Promise<ArticleCategory> {
    return await this.service.findById(articleId, categoryId);
  }

  @Patch(':articleId/:categoryId')
  @ApiOperation({ summary: '修改单条' })
  @ApiParam({ name: 'articleId', description: '文章ID' })
  @ApiParam({ name: 'categoryId', description: '分类ID' })
  @ApiBody({ type: UpdateArticleCategoryDto })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('articleId') articleId: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateArticleCategoryDto,
  ): Promise<void> {
    return await this.service.update(articleId, categoryId, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除记录' })
  @ApiBody({ type: DeleteArticleCategoryDto })
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
  async delete(@Body() dto: DeleteArticleCategoryDto): Promise<{ message: string; deletedCount: number }> {
    return await this.service.remove(dto);
  }
}
