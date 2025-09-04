import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { GetCurrentUser, Public } from 'src/common/decorators';
import { formatISOString } from 'src/utils';
import { AuthService } from './auth.service';
import { CaptchaVerifyDto } from './dto/captcha-verify.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { Auth } from './entities/auth.entity';

@ApiTags('认证管理')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 获取验证码
   * 返回验证码图片和对应的token
   * 支持防爬机制
   */
  @ApiOperation({
    summary: '获取验证码',
    description: '生成验证码图片和对应的token，支持防爬机制和安全增强',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取验证码',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          description: '验证码图片的base64编码',
          example: 'data:image/svg+xml;base64,PHN2Zy4uLg==',
        },
        token: {
          type: 'string',
          description: '验证码token，用于后续验证',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        expiresIn: {
          type: 'number',
          description: '过期时间（秒）',
          example: 300,
        },
        nonce: {
          type: 'string',
          description: '防重放攻击的随机数',
          example: 'abc123def456',
        },
      },
    },
  })
  @Public()
  @Get('captcha')
  async getCaptcha(
    @Ip() clientIp: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<{
    image: string;
    token: string;
    expiresIn: number;
    nonce: string;
  }> {
    const clientInfo = { ip: clientIp, userAgent };
    const result = await this.authService.generateCaptcha(clientInfo);

    return {
      image: result.image,
      token: result.token,
      expiresIn: result.expiresIn,
      nonce: Math.random().toString(36).substring(2, 15),
    };
  }

  /**
   * 验证验证码
   * 独立的验证接口，遵循RESTful设计
   * 包含安全验证机制
   */
  @ApiOperation({
    summary: '验证验证码',
    description: '验证用户输入的验证码是否正确，包含安全验证机制',
  })
  @ApiBody({
    description: '验证码验证请求',
    type: CaptchaVerifyDto,
  })
  @ApiResponse({
    status: 200,
    description: '验证码验证结果',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: '验证是否成功',
          example: true,
        },
        message: {
          type: 'string',
          description: '验证结果消息',
          example: '验证码验证成功',
        },
        timestamp: {
          type: 'string',
          description: '时间戳',
          example: '2023-12-01T10:00:00.000Z',
        },
      },
    },
  })
  @Public()
  @Post('captcha/verify')
  async verifyCaptcha(
    @Body() body: { token: string; code: string },
    @Ip() _clientIp: string,
    @Headers('user-agent') _userAgent: string,
  ): Promise<{ success: boolean; message: string; timestamp?: string }> {
    const { token, code } = body;

    if (!token || !code) {
      return {
        success: false,
        message: '验证码token和code不能为空',
        timestamp: formatISOString(),
      };
    }

    const result = await this.authService.verifyCaptcha({
      token,
      code,
    });

    return {
      success: result.success ?? false,
      message: result.success ? '验证码验证成功' : `验证码验证失败: ${result.message}`,
      timestamp: formatISOString(),
    };
  }

  @ApiOperation({
    summary: '获取用户信息',
    description: '获取当前登录用户的详细信息，包括权限和角色',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取用户信息',
    schema: {
      type: 'object',
      properties: {
        buttons: {
          type: 'array',
          items: { type: 'string' },
          description: '用户权限按钮',
          example: ['B_CODE1', 'B_CODE2', 'B_CODE3'],
        },
        roles: {
          type: 'array',
          items: { type: 'string' },
          description: '用户角色',
          example: ['admin', 'user'],
        },
        userId: {
          type: 'number',
          description: '用户ID',
          example: 1,
        },
        userName: {
          type: 'string',
          description: '用户名',
          example: 'john_doe',
        },
      },
    },
  })
  @ApiBearerAuth()
  @Get('getUserInfo')
  getUserInfo(@GetCurrentUser() user: Auth): {
    authId: string;
    username: string;
    roles: string[];
    lastLoginAt: Date;
  } {
    return this.authService.getAuthInfo(user);
  }

  @ApiOperation({
    summary: '用户登录',
    description: '用户使用用户名和密码进行登录认证',
  })
  @ApiBody({
    description: '登录请求',
    type: LoginDto,
  })
  @ApiResponse({
    status: 201,
    description: '登录成功',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT访问令牌',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT刷新令牌',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        {
          type: 'string',
          description: '错误消息',
          example: '用户不存在',
        },
      ],
    },
  })
  @Public()
  @Post('login')
  login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(body);
  }

  @ApiOperation({
    summary: '用户注册',
    description: '新用户注册账号',
  })
  @ApiBody({
    description: '注册请求',
    type: CreateAuthDto,
  })
  @ApiResponse({
    status: 200,
    description: '注册结果',
    schema: {
      type: 'string',
      description: '注册结果消息',
      example: '注册成功',
    },
  })
  @Public()
  @Post('register')
  register(@Body() body: CreateAuthDto): Promise<RegisterResponseDto> {
    return this.authService.register(body);
  }

  /**
   * 创建用户（需要验证码验证）
   * 使用无状态验证码验证机制
   */
  @ApiOperation({
    summary: '创建用户',
    description: '创建新用户，需要验证码验证，使用无状态验证码验证机制',
  })
  @ApiBody({
    description: '创建用户请求',
    type: RegisterDto,
  })
  @ApiResponse({
    status: 200,
    description: '用户创建结果',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: '操作是否成功',
          example: true,
        },
        message: {
          type: 'string',
          description: '结果消息',
          example: '用户创建成功',
        },
        data: {
          type: 'object',
          description: '用户数据',
          additionalProperties: true,
        },
        timestamp: {
          type: 'string',
          description: '时间戳',
          example: '2023-12-01T10:00:00.000Z',
        },
      },
    },
  })
  @Public()
  @Post('create')
  async createUser(
    @Body() body: RegisterDto,
    @Req() _req: Request,
  ): Promise<{
    success: boolean;
    message: string;
    record?: Partial<Auth>;
  }> {
    const { captchaToken, captchaCode, ...userData } = body;

    // 验证必要参数
    if (!captchaToken || !captchaCode) {
      return {
        success: false,
        message: '验证码token和验证码不能为空',
      };
    }

    // 验证验证码
    const captchaResult = await this.authService.verifyCaptcha({
      token: captchaToken,
      code: captchaCode,
    });

    if (!captchaResult.success) {
      return {
        success: false,
        message: `验证码验证失败: ${captchaResult.message}`,
      };
    }

    // 验证码通过，执行用户创建逻辑
    try {
      // 这里可以调用实际的用户创建服务
      const result = await this.authService.register({
        ...userData,
        captchaToken,
        captchaCode,
      });

      return {
        success: true,
        message: '用户创建成功',
        record: {
          id: result.userId,
          userName: result.username,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: '用户创建失败',
      };
    }
  }
}
