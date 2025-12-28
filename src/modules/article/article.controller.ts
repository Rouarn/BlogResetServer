import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ArticleService } from './article.service';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { DeleteArticleDto } from './dto/delete-article.dto';

@ApiTags('文章管理')
@ApiBearerAuth()
@Controller('article')
export class ArticleController {
  constructor(private readonly service: ArticleService) {}

  @Post()
  @ApiOperation({ summary: '创建记录' })
  @ApiResponse({ status: 201, type: Article })
  async create(@Body() dto: CreateArticleDto): Promise<void> {
    return await this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询全表' })
  async findAll(@Query() query: QueryArticleDto): Promise<{ data: Article[]; total: number }> {
    const { current, size } = query;
    return await this.service.findAll(current, size);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单条' })
  async findOne(@Param('id') id: string): Promise<Article> {
    return await this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改单条' })
  async update(@Param('id') id: string, @Body() dto: UpdateArticleDto): Promise<void> {
    return await this.service.update(id, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除记录' })
  async delete(@Query() query: DeleteArticleDto): Promise<{ message: string }> {
    return await this.service.remove(query);
  }
}
