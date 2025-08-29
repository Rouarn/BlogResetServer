import { ApiProperty } from '@nestjs/swagger';

/**
 * 登录成功响应DTO
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'JWT刷新令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

/**
 * 用户信息响应DTO
 */
export class UserInfoResponseDto {
  @ApiProperty({
    description: '用户权限按钮',
    example: ['B_CODE1', 'B_CODE2', 'B_CODE3'],
    type: [String],
  })
  buttons: string[];

  @ApiProperty({
    description: '用户角色',
    example: ['admin', 'user'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: '用户ID',
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: '用户名',
    example: 'john_doe',
  })
  userName: string;
}

/**
 * 验证码响应DTO
 */
export class CaptchaResponseDto {
  @ApiProperty({
    description: '验证码图片的base64编码',
    example: 'data:image/svg+xml;base64,PHN2Zy4uLg==',
  })
  image: string;

  @ApiProperty({
    description: '验证码token，用于后续验证',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: '过期时间（秒）',
    example: 300,
  })
  expiresIn: number;

  @ApiProperty({
    description: '防重放攻击的随机数',
    example: 'abc123def456',
  })
  nonce: string;
}

/**
 * 通用操作响应DTO
 */
export class CommonResponseDto {
  @ApiProperty({
    description: '操作是否成功',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '响应消息',
    example: '操作成功',
  })
  message: string;

  @ApiProperty({
    description: '时间戳',
    example: '2023-12-01T10:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: '响应数据',
    required: false,
  })
  data?: any;

  @ApiProperty({
    description: '错误信息',
    required: false,
  })
  error?: string;
}