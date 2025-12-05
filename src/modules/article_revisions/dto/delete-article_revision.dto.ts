import { IsOptional, IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';

export class DeleteArticleRevisionDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  ids?: string[];
}
