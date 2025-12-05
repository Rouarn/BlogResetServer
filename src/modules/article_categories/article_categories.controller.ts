import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiResponse({ status: 201, type: ArticleCategory })
  async create(@Body() dto: CreateArticleCategoryDto): Promise<void> {
    return await this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询全表' })
  async findAll(@Query() query: QueryArticleCategoryDto): Promise<{ data: ArticleCategory[]; total: number }> {
    const { current, size } = query;
    return await this.service.findAll(current, size);
  }

  @Get(':articleId/:categoryId')
  @ApiOperation({ summary: '查询单条' })
  async findOne(
    @Param('articleId') articleId: string,
    @Param('categoryId') categoryId: string,
  ): Promise<ArticleCategory> {
    return await this.service.findById(articleId, categoryId);
  }

  @Patch(':articleId/:categoryId')
  @ApiOperation({ summary: '修改单条' })
  async update(
    @Param('articleId') articleId: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateArticleCategoryDto,
  ): Promise<void> {
    return await this.service.update(articleId, categoryId, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除记录' })
  async delete(@Body() dto: DeleteArticleCategoryDto): Promise<{ message: string; deletedCount: number }> {
    return await this.service.remove(dto);
  }
}
