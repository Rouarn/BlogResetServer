import { IsUUID } from 'class-validator';

export class CreateArticleTagDto {
  @IsUUID()
  articleId: string;

  @IsUUID()
  tagId: string;
}
