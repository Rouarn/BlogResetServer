import { IsOptional, IsString } from 'class-validator';

export class CreateTagDto {
  @IsOptional()
  @IsString()
  name?: string;
}
