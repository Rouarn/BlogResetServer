import { IsOptional, IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';

export class DeleteArticleLikeDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  ids?: string[];
}
