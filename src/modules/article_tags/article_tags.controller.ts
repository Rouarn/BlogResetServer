import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiResponse({ status: 201, type: ArticleTag })
  async create(@Body() dto: CreateArticleTagDto): Promise<void> {
    return await this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询全表' })
  async findAll(@Query() query: QueryArticleTagDto): Promise<{ data: ArticleTag[]; total: number }> {
    const { current, size } = query;
    return await this.service.findAll(current, size);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单条' })
  async findOne(@Param('id') id: string): Promise<ArticleTag> {
    return await this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改单条' })
  async update(@Param('id') id: string, @Body() dto: UpdateArticleTagDto): Promise<void> {
    return await this.service.update(id, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除记录' })
  async delete(@Body() dto: DeleteArticleTagDto): Promise<{ message: string; deletedCount: number }> {
    return await this.service.remove(dto);
  }
}
