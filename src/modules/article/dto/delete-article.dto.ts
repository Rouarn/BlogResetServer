import { IsOptional, IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';

export class DeleteArticleDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  ids?: string[];
}
