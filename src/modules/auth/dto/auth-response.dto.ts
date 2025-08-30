import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户信息响应 DTO
 */
export class UserInfoDto {
  @ApiProperty({ description: '用户ID' })
  id: string;

  @ApiProperty({ description: '用户名' })
  userName: string;

  @ApiProperty({ description: '邮箱' })
  email: string;

  @ApiProperty({ description: '角色' })
  roles: string[];

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

/**
 * 登录响应 DTO
 */
export class LoginResponseDto {
  @ApiProperty({ description: '访问令牌' })
  accessToken: string;

  @ApiProperty({ description: '刷新令牌' })
  refreshToken: string;

  @ApiProperty({ description: '令牌类型', default: 'Bearer' })
  tokenType: string;

  @ApiProperty({ description: '过期时间（秒）' })
  expiresIn: number;

  @ApiProperty({ description: '用户信息', type: UserInfoDto })
  user: UserInfoDto;
}

/**
 * 注册响应 DTO
 */
export class RegisterResponseDto {
  @ApiProperty({ description: '用户信息', type: UserInfoDto })
  user: UserInfoDto;

  @ApiProperty({ description: '注册消息' })
  message: string;
}

/**
 * 刷新令牌响应 DTO
 */
export class RefreshTokenResponseDto {
  @ApiProperty({ description: '新的访问令牌' })
  accessToken: string;

  @ApiProperty({ description: '新的刷新令牌' })
  refreshToken: string;

  @ApiProperty({ description: '令牌类型', default: 'Bearer' })
  tokenType: string;

  @ApiProperty({ description: '过期时间（秒）' })
  expiresIn: number;
}

/**
 * 验证响应 DTO
 */
export class ValidateResponseDto {
  @ApiProperty({ description: '验证状态' })
  valid: boolean;

  @ApiProperty({ description: '用户信息', type: UserInfoDto, required: false })
  user?: UserInfoDto;

  @ApiProperty({ description: '验证消息' })
  message: string;
}

/**
 * 通用认证响应 DTO
 */
export class AuthResponseDto {
  @ApiProperty({ description: '响应数据' })
  data: unknown;

  @ApiProperty({ description: '响应消息' })
  message: string;

  @ApiProperty({ description: '响应代码' })
  code: number;

  @ApiProperty({ description: '时间戳' })
  timestamp: string;
}
