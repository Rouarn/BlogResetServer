import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { LikeBy } from '../entities/article_like.entity';

export class CreateArticleLikeDto {
  @IsUUID()
  articleId: string;

  @IsOptional()
  @IsEnum(LikeBy)
  likedBy?: LikeBy;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  ipHash?: string;
}
