import { IsString, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: '分类名' })
  @IsString()
  name: string;

  @ApiProperty({ description: '英文标识' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Tailwind 颜色类', required: false })
  @IsOptional()
  @IsString()
  colorClass?: string;

  @ApiProperty({ description: '排序权重', required: false, default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
