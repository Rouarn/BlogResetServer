import { Public } from '@/common/decorators';
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArchiveItem, ArticleDetail, ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { DeleteArticleDto } from './dto/delete-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';

@ApiTags('Article')
@Controller('articles')
export class ArticleController {
  constructor(private readonly service: ArticleService) {}

  @Post()
  @ApiOperation({ summary: '创建文章' })
  create(@Body() dto: CreateArticleDto): Promise<void> {
    return this.service.create(dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除文章' })
  remove(@Body() dto: DeleteArticleDto): Promise<{ message: string }> {
    return this.service.remove(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新文章' })
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto): Promise<void> {
    return this.service.update(id, dto);
  }

  @Get('archive')
  @Public()
  @ApiOperation({ summary: '文章归档' })
  getArchive(): Promise<ArchiveItem[]> {
    return this.service.getArchive();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '查询文章详情' })
  getDetail(@Param('id') id: string): Promise<ArticleDetail> {
    return this.service.findById(id);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: '查询文章列表' })
  list(@Query() query: QueryArticleDto): Promise<{ data: Article[]; total: number }> {
    return this.service.findAll(query);
  }
}
