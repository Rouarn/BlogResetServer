import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ArticleLikesService } from './article_likes.service';
import { ArticleLike } from './entities/article_like.entity';
import { CreateArticleLikeDto } from './dto/create-article_like.dto';
import { UpdateArticleLikeDto } from './dto/update-article_like.dto';
import { QueryArticleLikeDto } from './dto/query-article_like.dto';
import { DeleteArticleLikeDto } from './dto/delete-article_like.dto';

@ApiTags('ArticleLikes管理')
@ApiBearerAuth()
@Controller('article_likes')
export class ArticleLikesController {
  constructor(private readonly service: ArticleLikesService) {}

  @Post()
  @ApiOperation({ summary: '创建记录' })
  @ApiResponse({ status: 201, type: ArticleLike })
  async create(@Body() dto: CreateArticleLikeDto): Promise<void> {
    return await this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询全表' })
  async findAll(@Query() query: QueryArticleLikeDto): Promise<{ data: ArticleLike[]; total: number }> {
    const { current, size } = query;
    return await this.service.findAll(current, size);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单条' })
  async findOne(@Param('id') id: string): Promise<ArticleLike> {
    return await this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改单条' })
  async update(@Param('id') id: string, @Body() dto: UpdateArticleLikeDto): Promise<void> {
    return await this.service.update(id, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除记录' })
  async delete(@Body() dto: DeleteArticleLikeDto): Promise<{ message: string; deletedCount: number }> {
    return await this.service.remove(dto);
  }
}
