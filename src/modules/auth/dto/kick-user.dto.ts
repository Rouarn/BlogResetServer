import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * 强制下线（踢人）请求 DTO
 */
export class KickUserDto {
  @ApiProperty({
    description: '用户ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Token 签名（用于踢出特定设备），不传则踢出该用户所有设备',
    example: 'xxxx-xxxx-xxxx',
    required: false,
  })
  @IsString()
  @IsOptional()
  tokenSignature?: string;

  @ApiProperty({
    description: '下线原因',
    example: '账号异常',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
