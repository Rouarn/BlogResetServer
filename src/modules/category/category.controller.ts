import { Public } from '@/common/decorators';
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoryService, CategoryWithCount } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { DeleteCategoryDto } from './dto/delete-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@ApiTags('类别')
@Controller('categories')
export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  @Post()
  @ApiOperation({ summary: '创建分类' })
  create(@Body() dto: CreateCategoryDto): Promise<void> {
    return this.service.create(dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除分类' })
  remove(@Body() dto: DeleteCategoryDto): Promise<{ message: string }> {
    return this.service.remove(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新分类' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<void> {
    return this.service.update(id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询分类详情' })
  getDetail(@Param('id') id: string): Promise<Category> {
    return this.service.findById(id);
  }

  @Get()
  @Public() // Public access for frontend
  @ApiOperation({ summary: '查询分类列表 (支持统计)' })
  async list(
    @Query() query: QueryCategoryDto,
  ): Promise<CategoryWithCount[] | { data: Category[]; total: number }> {
    // Check if it's an admin table query (usually has page/size)
    if (query.current && query.size) {
      return this.service.findAll(query.current, query.size);
    }

    return this.service.findAllWithCount();
  }
}
