import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryArticleDto {
  @ApiPropertyOptional({ description: '当前页码', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  current?: number;

  @ApiPropertyOptional({ description: '每页条数', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  size?: number;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '分类ID' })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  categoryId?: number;

  @ApiPropertyOptional({ description: '作者ID' })
  @IsOptional()
  @IsString()
  authorId?: string;
}
