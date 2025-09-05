import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

/**
 * 登录DTO
 *
 * 用于用户登录认证的数据传输对象。
 * 专注于认证相关字段，不包含用户资料信息。
 *
 * 字段说明：
 * - username: 用户名（必填）
 * - password: 密码（必填）
 * - captchaToken: 验证码令牌（可选）
 * - captchaCode: 验证码（可选）
 *
 * 验证规则：
 * - username: 3-20个字符
 * - password: 6-50个字符
 * - captchaCode: 4-6个字符（如果提供）
 *
 * 安全特性：
 * - 密码字段不会在响应中返回
 * - 支持验证码验证
 */
export class LoginDto {
  @ApiProperty({
    description: '用户名',
    example: 'admin',
    minLength: 3,
    maxLength: 20,
  })
  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @Length(3, 20, { message: '用户名长度必须在3-20个字符之间' })
  username: string;

  @ApiProperty({
    description: '密码',
    example: '123456',
    minLength: 6,
    maxLength: 50,
  })
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @Length(6, 50, { message: '密码长度必须在6-50个字符之间' })
  password: string;

  @ApiPropertyOptional({
    description: '验证码令牌',
    example: 'captcha-token-123',
  })
  @IsOptional()
  @IsString({ message: '验证码令牌必须是字符串' })
  captchaToken?: string;

  @ApiPropertyOptional({
    description: '验证码',
    example: 'ABCD',
    minLength: 4,
    maxLength: 6,
  })
  @IsOptional()
  @IsString({ message: '验证码必须是字符串' })
  @Length(4, 6, { message: '验证码长度必须在4-6个字符之间' })
  captchaCode?: string;
}

/**
 * 登录响应DTO
 *
 * 登录成功后返回的数据结构。
 *
 * 字段说明：
 * - accessToken: 访问令牌
 * - refreshToken: 刷新令牌（可选）
 * - expiresIn: 令牌过期时间（秒）
 * - tokenType: 令牌类型
 * - user: 用户基本信息
 */
export class LoginResponseDto {
  @ApiProperty({
    description: '访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiPropertyOptional({
    description: '刷新令牌',
    example: 'refresh-token-123',
  })
  refreshToken?: string;

  @ApiProperty({
    description: '令牌过期时间（秒）',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: '令牌类型',
    example: 'Bearer',
    default: 'Bearer',
  })
  tokenType: string = 'Bearer';

  @ApiProperty({
    description: '用户基本信息',
    type: 'object',
    properties: {
      userId: { type: 'string', description: '用户ID' },
      username: { type: 'string', description: '用户名' },
      nickname: { type: 'string', description: '昵称' },
      avatar: { type: 'string', description: '头像' },
      roles: { type: 'string', description: '角色' },
    },
  })
  user: {
    userId: string;
    username: string;
    nickname: string;
    avatar: string;
    roles: string;
  };
}
