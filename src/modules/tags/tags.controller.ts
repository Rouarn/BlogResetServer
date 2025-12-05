import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { QueryTagDto } from './dto/query-tag.dto';
import { DeleteTagDto } from './dto/delete-tag.dto';

@ApiTags('Tags管理')
@ApiBearerAuth()
@Controller('tags')
export class TagsController {
  constructor(private readonly service: TagsService) {}

  @Post()
  @ApiOperation({ summary: '创建记录' })
  @ApiBody({ type: CreateTagDto })
  @ApiResponse({ status: 201, type: Tag })
  async create(@Body() dto: CreateTagDto): Promise<void> {
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
        data: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
        total: { type: 'number' },
      },
    },
  })
  async findAll(@Query() query: QueryTagDto): Promise<{ data: Tag[]; total: number }> {
    const { current, size } = query;
    return await this.service.findAll(current, size);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单条' })
  @ApiParam({ name: 'id', description: '记录ID' })
  @ApiResponse({ status: 200, type: Tag })
  async findOne(@Param('id') id: string): Promise<Tag> {
    return await this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改单条' })
  @ApiParam({ name: 'id', description: '记录ID' })
  @ApiBody({ type: UpdateTagDto })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(@Param('id') id: string, @Body() dto: UpdateTagDto): Promise<void> {
    return await this.service.update(id, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除记录' })
  @ApiBody({ type: DeleteTagDto })
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
  async delete(@Body() dto: DeleteTagDto): Promise<{ message: string; deletedCount: number }> {
    return await this.service.remove(dto);
  }
}
