import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * 创建用户请求DTO
 */
export class CreateUserDto {
  @ApiProperty({
    description: '验证码token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  captchaToken: string;

  @ApiProperty({
    description: '验证码',
    example: 'ABCD',
  })
  @IsString()
  @IsNotEmpty()
  captchaCode: string;

  @ApiProperty({
    description: '用户名',
    example: 'john_doe',
  })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({
    description: '密码',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: '昵称',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({
    description: '用户角色',
    example: 'user',
    required: false,
  })
  @IsString()
  @IsOptional()
  roles?: string;
}
