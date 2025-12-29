import { Public } from '@/common/decorators';
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoryService, CategoryWithCount } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { DeleteCategoryDto } from './dto/delete-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@ApiTags('Category')
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
    // If it's a simple list request without pagination params, return all with counts
    // But since QueryCategoryDto has defaults, we might want to check logic.
    // However, the frontend requirement is GET /categories -> Array<Category & { count: number }>
    // Let's assume if query params are default or empty, we return the full list with counts for frontend.
    // Or we can differentiate by a flag. But given the design doc:
    // GET /categories -> Array<Category & { count: number }>
    // So let's prioritize that for the main endpoint.
    // But we also need admin pagination.
    // Let's return the list with counts if no pagination is explicitly requested or if it's a specific flag?
    // Actually, standard REST: GET /categories usually returns list.
    // Let's implement a specific logic: if no pagination params provided (or we just override for now as the design doc implies this is the main usage).
    // The design doc says: GET /categories -> Array<Category & { count: number }>
    // So let's return that.

    // Check if it's an admin table query (usually has page/size)
    if (query.current && query.size) {
      return this.service.findAll(query.current, query.size);
    }

    return this.service.findAllWithCount();
  }
}
