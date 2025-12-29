import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class DeleteArticleDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids?: string[];
}
