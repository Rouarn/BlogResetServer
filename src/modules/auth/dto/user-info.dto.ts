import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
/**
 * 认证用户信息响应DTO
 *
 * 用于统一描述从认证模块返回的用户信息结构，包含非敏感字段。
 */
export class AuthUserInfoDto {
  @ApiProperty({ description: '用户ID', example: 'user-uuid-123' })
  userId: string;

  @ApiProperty({ description: '用户名', example: 'admin' })
  username: string;

  @ApiProperty({ description: '昵称', example: 'Admin' })
  nickname: string;

  @ApiPropertyOptional({ description: '头像URL', example: 'https://example.com/avatar.jpg' })
  avatar: string;

  @ApiProperty({ description: '角色标识', example: 'ADMIN' })
  roles: string;

  @ApiPropertyOptional({ description: '邮箱地址', example: 'admin@example.com' })
  email: string;

  @ApiPropertyOptional({ description: '性别展示标签', example: '男' })
  gender: string;

  @ApiPropertyOptional({ description: '手机号', example: '13800138000' })
  mobile: string;

  @ApiPropertyOptional({ description: '个人简介', example: '系统管理员' })
  bio: string;

  @ApiPropertyOptional({ description: '生日', example: '1990-01-01' })
  birthday: Date | undefined;

  @ApiPropertyOptional({ description: '所在城市', example: '北京市' })
  city: string;

  @ApiPropertyOptional({ description: '职业', example: '软件工程师' })
  profession: string;

  @ApiProperty({ description: '认证记录ID', example: 'auth-uuid-123' })
  authId: string;

  @ApiProperty({ description: '最近一次登录时间', example: '2024-01-01T12:00:00.000Z' })
  lastLoginAt: Date;

  @ApiPropertyOptional({ description: '最近一次登录IP', example: '192.168.1.100' })
  lastLoginIp: string;
}
