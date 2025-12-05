import { IsOptional, IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';

export class DeleteCommentDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  ids?: string[];
}
