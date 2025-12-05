import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateArticleRevisionDto {
  @IsUUID()
  articleId: string;

  @IsUUID()
  editorId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsString()
  contentMd: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
