import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { DeleteCategoryDto } from './dto/delete-category.dto';

@ApiTags('Categories管理')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: '创建记录' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, type: Category })
  async create(@Body() dto: CreateCategoryDto): Promise<void> {
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
        data: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
        total: { type: 'number' },
      },
    },
  })
  async findAll(@Query() query: QueryCategoryDto): Promise<{ data: Category[]; total: number }> {
    const { current, size } = query;
    return await this.service.findAll(current, size);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单条' })
  @ApiParam({ name: 'id', description: '记录ID' })
  @ApiResponse({ status: 200, type: Category })
  async findOne(@Param('id') id: string): Promise<Category> {
    return await this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改单条' })
  @ApiParam({ name: 'id', description: '记录ID' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<void> {
    return await this.service.update(id, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除记录' })
  @ApiBody({ type: DeleteCategoryDto })
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
  async delete(@Body() dto: DeleteCategoryDto): Promise<{ message: string; deletedCount: number }> {
    return await this.service.remove(dto);
  }
}
