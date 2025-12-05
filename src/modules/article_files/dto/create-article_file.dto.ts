import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateArticleFileDto {
  @IsUUID()
  articleId: string;

  @IsUUID()
  fileId: string;

  @IsOptional()
  @IsString()
  description?: string;
}
