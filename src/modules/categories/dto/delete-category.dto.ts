import { IsOptional, IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';

export class DeleteCategoryDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  ids?: string[];
}
