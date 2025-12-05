import { IsOptional, IsString } from 'class-validator';

export class CreateArticleLikeDto {
  @IsOptional()
  @IsString()
  name?: string;
}
