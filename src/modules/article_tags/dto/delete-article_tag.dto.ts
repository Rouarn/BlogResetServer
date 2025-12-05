import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export class ArticleTagKeyDto {
  @IsUUID()
  articleId: string;

  @IsUUID()
  tagId: string;
}

export class DeleteArticleTagDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ArticleTagKeyDto)
  key?: ArticleTagKeyDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArticleTagKeyDto)
  @ArrayNotEmpty()
  keys?: ArticleTagKeyDto[];
}
