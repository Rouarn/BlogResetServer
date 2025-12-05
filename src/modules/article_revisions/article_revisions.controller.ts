import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ArticleRevisionsService } from './article_revisions.service';
import { ArticleRevision } from './entities/article_revision.entity';
import { CreateArticleRevisionDto } from './dto/create-article_revision.dto';
import { UpdateArticleRevisionDto } from './dto/update-article_revision.dto';
import { QueryArticleRevisionDto } from './dto/query-article_revision.dto';
import { DeleteArticleRevisionDto } from './dto/delete-article_revision.dto';

@ApiTags('ArticleRevisions管理')
@ApiBearerAuth()
@Controller('article_revisions')
export class ArticleRevisionsController {
  constructor(private readonly service: ArticleRevisionsService) {}

  @Post()
  @ApiOperation({ summary: '创建记录' })
  @ApiResponse({ status: 201, type: ArticleRevision })
  async create(@Body() dto: CreateArticleRevisionDto): Promise<void> {
    return await this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询全表' })
  async findAll(@Query() query: QueryArticleRevisionDto): Promise<{ data: ArticleRevision[]; total: number }> {
    const { current, size } = query;
    return await this.service.findAll(current, size);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单条' })
  async findOne(@Param('id') id: string): Promise<ArticleRevision> {
    return await this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改单条' })
  async update(@Param('id') id: string, @Body() dto: UpdateArticleRevisionDto): Promise<void> {
    return await this.service.update(id, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除记录' })
  async delete(@Body() dto: DeleteArticleRevisionDto): Promise<{ message: string; deletedCount: number }> {
    return await this.service.remove(dto);
  }
}
