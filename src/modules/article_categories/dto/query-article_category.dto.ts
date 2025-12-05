import { IsOptional, IsInt, Min } from 'class-validator';

export class QueryArticleCategoryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  current?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  size?: number;
}
