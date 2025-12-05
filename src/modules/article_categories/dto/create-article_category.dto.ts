import { IsUUID } from 'class-validator';

export class CreateArticleCategoryDto {
  @IsUUID()
  articleId: string;

  @IsUUID()
  categoryId: string;
}
