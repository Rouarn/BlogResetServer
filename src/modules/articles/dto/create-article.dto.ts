import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ArticleStatus, ArticleVisibility } from '../entities/article.entity';

export class CreateArticleDto {
  @IsUUID()
  authorId: string;

  @IsOptional()
  @IsUUID()
  editorId?: string;

  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsString()
  contentMd: string;

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @IsOptional()
  @IsEnum(ArticleVisibility)
  visibility?: ArticleVisibility;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsUUID()
  coverFileId?: string;

  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;
}
