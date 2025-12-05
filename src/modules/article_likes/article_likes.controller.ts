import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiBody({ type: CreateArticleLikeDto })
  @ApiResponse({ status: 201, type: ArticleLike })
  async create(@Body() dto: CreateArticleLikeDto): Promise<void> {
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
        data: { type: 'array', items: { $ref: '#/components/schemas/ArticleLike' } },
        total: { type: 'number' },
      },
    },
  })
  async findAll(@Query() query: QueryArticleLikeDto): Promise<{ data: ArticleLike[]; total: number }> {
    const { current, size } = query;
    return await this.service.findAll(current, size);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单条' })
  @ApiParam({ name: 'id', description: '记录ID' })
  @ApiResponse({ status: 200, type: ArticleLike })
  async findOne(@Param('id') id: string): Promise<ArticleLike> {
    return await this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改单条' })
  @ApiParam({ name: 'id', description: '记录ID' })
  @ApiBody({ type: UpdateArticleLikeDto })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(@Param('id') id: string, @Body() dto: UpdateArticleLikeDto): Promise<void> {
    return await this.service.update(id, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除记录' })
  @ApiBody({ type: DeleteArticleLikeDto })
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
  async delete(@Body() dto: DeleteArticleLikeDto): Promise<{ message: string; deletedCount: number }> {
    return await this.service.remove(dto);
  }
}
