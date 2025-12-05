import { IsOptional, IsString } from 'class-validator';

export class CreateArticleRevisionDto {
  @IsOptional()
  @IsString()
  name?: string;
}
