import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export class ArticleCategoryKeyDto {
  @IsUUID()
  articleId: string;

  @IsUUID()
  categoryId: string;
}

export class DeleteArticleCategoryDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ArticleCategoryKeyDto)
  key?: ArticleCategoryKeyDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArticleCategoryKeyDto)
  @ArrayNotEmpty()
  keys?: ArticleCategoryKeyDto[];
}
