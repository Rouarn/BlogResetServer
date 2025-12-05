import { IsOptional, IsString } from 'class-validator';

export class CreateArticleFileDto {
  @IsOptional()
  @IsString()
  name?: string;
}
