import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiResponse({ status: 201, type: Comment })
  async create(@Body() dto: CreateCommentDto): Promise<void> {
    return await this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询全表' })
  async findAll(@Query() query: QueryCommentDto): Promise<{ data: Comment[]; total: number }> {
    const { current, size } = query;
    return await this.service.findAll(current, size);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单条' })
  async findOne(@Param('id') id: string): Promise<Comment> {
    return await this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改单条' })
  async update(@Param('id') id: string, @Body() dto: UpdateCommentDto): Promise<void> {
    return await this.service.update(id, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除记录' })
  async delete(@Body() dto: DeleteCommentDto): Promise<{ message: string; deletedCount: number }> {
    return await this.service.remove(dto);
  }
}
