import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * JWT载荷DTO
 *
 * JWT令牌中包含的用户信息载荷。
 *
 * 字段说明：
 * - authId: 认证ID
 * - username: 用户名
 * - roles: 用户角色
 * - iat: 签发时间（JWT标准字段）
 * - exp: 过期时间（JWT标准字段）
 */
export class JwtPayloadDto {
  @ApiProperty({
    description: '认证ID',
    example: 'auth-uuid-456',
  })
  authId: string;

  @ApiProperty({
    description: '用户ID',
    example: 'user-uuid-123',
  })
  userId: string;

  @ApiProperty({
    description: '用户名',
    example: 'admin',
  })
  username: string;

  @ApiProperty({
    description: '用户角色',
    example: 'ADMIN',
  })
  roles: string;

  @ApiProperty({
    description: '签发时间（Unix时间戳）',
    example: 1640995200,
  })
  iat: number;

  @ApiProperty({
    description: '过期时间（Unix时间戳）',
    example: 1640998800,
  })
  exp: number;
}

/**
 * 刷新令牌DTO
 *
 * 用于刷新访问令牌的数据传输对象。
 *
 * 字段说明：
 * - refreshToken: 刷新令牌（必填）
 *
 * 验证规则：
 * - refreshToken: 必填字符串
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: '刷新令牌',
    example: 'refresh-token-789',
  })
  @IsString({ message: '刷新令牌必须是字符串' })
  @IsNotEmpty({ message: '刷新令牌不能为空' })
  refreshToken: string;
}

/**
 * 令牌响应DTO
 *
 * 令牌生成或刷新后返回的数据结构。
 *
 * 字段说明：
 * - accessToken: 访问令牌
 * - refreshToken: 刷新令牌（可选）
 * - tokenType: 令牌类型
 * - expiresIn: 访问令牌过期时间（秒）
 * - refreshExpiresIn: 刷新令牌过期时间（秒，可选）
 */
export class TokenResponseDto {
  @ApiProperty({
    description: '访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiPropertyOptional({
    description: '刷新令牌',
    example: 'refresh-token-abc',
  })
  refreshToken?: string;

  @ApiProperty({
    description: '令牌类型',
    example: 'Bearer',
    default: 'Bearer',
  })
  tokenType: string = 'Bearer';

  @ApiProperty({
    description: '访问令牌过期时间（秒）',
    example: 3600,
  })
  expiresIn: number;

  @ApiPropertyOptional({
    description: '刷新令牌过期时间（秒）',
    example: 604800,
  })
  refreshExpiresIn?: number;
}

/**
 * 令牌验证DTO
 *
 * 用于验证令牌有效性的数据传输对象。
 *
 * 字段说明：
 * - token: 要验证的令牌（必填）
 * - type: 令牌类型（可选）
 *
 * 验证规则：
 * - token: 必填字符串
 * - type: 可选的令牌类型标识
 */
export class ValidateTokenDto {
  @ApiProperty({
    description: '要验证的令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: '令牌必须是字符串' })
  @IsNotEmpty({ message: '令牌不能为空' })
  token: string;

  @ApiPropertyOptional({
    description: '令牌类型',
    example: 'access',
    enum: ['access', 'refresh'],
  })
  @IsOptional()
  @IsString({ message: '令牌类型必须是字符串' })
  type?: string;
}

/**
 * 令牌验证响应DTO
 *
 * 令牌验证结果的数据结构。
 *
 * 字段说明：
 * - valid: 令牌是否有效
 * - expired: 令牌是否过期
 * - payload: 令牌载荷（如果有效）
 * - message: 验证结果消息
 */
export class ValidateTokenResponseDto {
  @ApiProperty({
    description: '令牌是否有效',
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    description: '令牌是否过期',
    example: false,
  })
  expired: boolean;

  @ApiPropertyOptional({
    description: '令牌载荷（如果有效）',
    type: JwtPayloadDto,
  })
  payload?: JwtPayloadDto;

  @ApiPropertyOptional({
    description: '用户信息（如果有效）',
    type: 'object',
    additionalProperties: false,
  })
  user?: {
    id: string;
    username: string;
    email: string;
  };

  @ApiProperty({
    description: '验证结果消息',
    example: '令牌验证成功',
  })
  message: string;
}

/**
 * 注销DTO
 *
 * 用于用户注销的数据传输对象。
 *
 * 字段说明：
 * - refreshToken: 刷新令牌（可选，用于黑名单）
 * - allDevices: 是否注销所有设备（可选）
 *
 * 验证规则：
 * - refreshToken: 可选字符串
 * - allDevices: 可选布尔值
 */
export class LogoutDto {
  @ApiPropertyOptional({
    description: '访问令牌（用于黑名单）',
    example: 'access-token-abc',
  })
  @IsOptional()
  @IsString({ message: '访问令牌必须是字符串' })
  accessToken?: string;

  @ApiPropertyOptional({
    description: '刷新令牌（用于黑名单）',
    example: 'refresh-token-def',
  })
  @IsOptional()
  @IsString({ message: '刷新令牌必须是字符串' })
  refreshToken?: string;

  @ApiPropertyOptional({
    description: '是否注销所有设备',
    example: false,
    default: false,
  })
  @IsOptional()
  allDevices?: boolean = false;
}

/**
 * 注销响应DTO
 *
 * 注销成功后返回的数据结构。
 *
 * 字段说明：
 * - message: 注销成功消息
 * - loggedOutDevices: 注销的设备数量（可选）
 */
export class LogoutResponseDto {
  @ApiProperty({
    description: '注销成功消息',
    example: '注销成功',
  })
  message: string;

  @ApiProperty({
    description: '是否成功注销',
    example: true,
  })
  loggedOut: boolean;

  @ApiPropertyOptional({
    description: '注销的设备数量',
    example: 1,
  })
  loggedOutDevices?: number;
}
