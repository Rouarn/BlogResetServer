import { IsOptional, IsString } from 'class-validator';

export class CreateArticleTagDto {
  @IsOptional()
  @IsString()
  name?: string;
}
