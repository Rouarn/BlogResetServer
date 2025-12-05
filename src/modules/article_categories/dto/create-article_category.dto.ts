import { IsOptional, IsString } from 'class-validator';

export class CreateArticleCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;
}
