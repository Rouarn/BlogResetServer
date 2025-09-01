import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 验证码验证请求DTO
 */
export class CaptchaVerifyDto {
  @ApiProperty({
    description: '验证码token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: '用户输入的验证码',
    example: 'ABCD',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
