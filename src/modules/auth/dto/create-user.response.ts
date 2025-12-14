import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
/**
 * 用户创建记录DTO
 */
export class AuthCreateUserRecord {
  @ApiProperty({ description: '用户ID', example: 'user-uuid-123' })
  id: string;

  @ApiProperty({ description: '用户名', example: 'newuser' })
  username: string;
}

/**
 * 创建用户响应DTO
 */
export class AuthCreateUserResponse {
  @ApiProperty({ description: '操作是否成功', example: true })
  success: boolean;

  @ApiProperty({ description: '结果消息', example: '用户创建成功' })
  message: string;

  @ApiPropertyOptional({ description: '用户记录', type: AuthCreateUserRecord })
  record?: AuthCreateUserRecord;
}
