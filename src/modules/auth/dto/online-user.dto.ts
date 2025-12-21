import { ApiProperty } from '@nestjs/swagger';

/**
 * 在线会话信息 DTO
 */
export class OnlineSessionDto {
  @ApiProperty({ description: '客户端IP地址', example: '127.0.0.1' })
  ip: string;

  @ApiProperty({ description: '用户代理', example: 'Mozilla/5.0...' })
  userAgent: string;

  @ApiProperty({ description: '登录时间', example: '2023-12-20T10:00:00.000Z' })
  loginAt: string;

  @ApiProperty({
    description: 'Redis Key（用于踢下线）',
    example: 'auth:online_user:uuid:signature',
  })
  key: string;

  @ApiProperty({ description: '用户ID', example: 'uuid' })
  userId: string;

  @ApiProperty({ description: '用户名', example: 'admin' })
  username: string;

  @ApiProperty({ description: '访问令牌', example: 'xxxx-xxxx-xxxx' })
  token: string;

  @ApiProperty({ description: '令牌签名', example: 'xxxx-xxxx-xxxx' })
  tokenSignature: string;
}

/**
 * 在线用户响应 DTO
 */
export class OnlineUserDto {
  @ApiProperty({ description: '用户ID', example: 'uuid' })
  userId: string;

  @ApiProperty({ description: '用户名', example: 'admin' })
  username: string;

  @ApiProperty({ description: '会话列表', type: [OnlineSessionDto] })
  sessions: OnlineSessionDto[];
}
