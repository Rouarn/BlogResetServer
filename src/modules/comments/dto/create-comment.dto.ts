import { IsBoolean, IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CommentStatus } from '../entities/comment.entity';

export class CreateCommentDto {
  @IsUUID()
  articleId: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  authorNickname?: string;

  @IsOptional()
  @IsEmail()
  authorEmail?: string;

  @IsOptional()
  @IsString()
  authorWebsite?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(CommentStatus)
  status?: CommentStatus;

  @IsOptional()
  @IsString()
  ipHash?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsUUID()
  moderatedById?: string;

  @IsOptional()
  @IsDateString()
  moderatedAt?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
