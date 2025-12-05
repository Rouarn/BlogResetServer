import { IsOptional, IsString } from 'class-validator';

export class CreateArticleDto {
  @IsOptional()
  @IsString()
  name?: string;
}
