import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { DeleteCommentDto } from './dto/delete-comment.dto';

@ApiTags('Comments管理')
@ApiBearerAuth()
@Controller('comments')
export class CommentsController {
  constructor(private readonly service: CommentsService) {}

  @Post()
  @ApiOperation({ summary: '创建记录' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, type: Comment })
  async create(@Body() dto: CreateCommentDto): Promise<void> {
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
        data: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
        total: { type: 'number' },
      },
    },
  })
  async findAll(@Query() query: QueryCommentDto): Promise<{ data: Comment[]; total: number }> {
    const { current, size } = query;
    return await this.service.findAll(current, size);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单条' })
  @ApiParam({ name: 'id', description: '记录ID' })
  @ApiResponse({ status: 200, type: Comment })
  async findOne(@Param('id') id: string): Promise<Comment> {
    return await this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改单条' })
  @ApiParam({ name: 'id', description: '记录ID' })
  @ApiBody({ type: UpdateCommentDto })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(@Param('id') id: string, @Body() dto: UpdateCommentDto): Promise<void> {
    return await this.service.update(id, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除记录' })
  @ApiBody({ type: DeleteCommentDto })
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
  async delete(@Body() dto: DeleteCommentDto): Promise<{ message: string; deletedCount: number }> {
    return await this.service.remove(dto);
  }
}
