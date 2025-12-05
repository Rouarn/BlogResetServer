import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiResponse({ status: 201, type: ArticleFile })
  async create(@Body() dto: CreateArticleFileDto): Promise<void> {
    return await this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询全表' })
  async findAll(@Query() query: QueryArticleFileDto): Promise<{ data: ArticleFile[]; total: number }> {
    const { current, size } = query;
    return await this.service.findAll(current, size);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单条' })
  async findOne(@Param('id') id: string): Promise<ArticleFile> {
    return await this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改单条' })
  async update(@Param('id') id: string, @Body() dto: UpdateArticleFileDto): Promise<void> {
    return await this.service.update(id, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除记录' })
  async delete(@Body() dto: DeleteArticleFileDto): Promise<{ message: string; deletedCount: number }> {
    return await this.service.remove(dto);
  }
}
