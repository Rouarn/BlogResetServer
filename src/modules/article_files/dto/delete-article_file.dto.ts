import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export class ArticleFileKeyDto {
  @IsUUID()
  articleId: string;

  @IsUUID()
  fileId: string;
}

export class DeleteArticleFileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ArticleFileKeyDto)
  key?: ArticleFileKeyDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArticleFileKeyDto)
  @ArrayNotEmpty()
  keys?: ArticleFileKeyDto[];
}
