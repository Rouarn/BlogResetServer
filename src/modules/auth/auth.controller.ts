import type {
  AuthCaptchaResponse,
  AuthCaptchaVerifyRequest,
  AuthCaptchaVerifyResponse,
  AuthCreateUserResponse,
  AuthMessageResponse,
  AuthUserInfo,
} from '@/modules/auth/auth.types';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  Put,
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
import { ChangePasswordDto, RegisterDto, RegisterResponseDto } from './dto/register.dto';
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
  ): Promise<AuthCaptchaResponse> {
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
    @Body() body: AuthCaptchaVerifyRequest,
    @Ip() _clientIp: string,
    @Headers('user-agent') _userAgent: string,
  ): Promise<AuthCaptchaVerifyResponse> {
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
        userId: {
          type: 'string',
          description: '用户ID',
          example: '1',
        },
        username: {
          type: 'string',
          description: '用户名',
          example: 'john_doe',
        },
        nickname: {
          type: 'string',
          description: '昵称',
          example: 'John',
        },
        avatar: {
          type: 'string',
          description: '头像',
          example: 'https://example.com/avatar.jpg',
        },
        roles: {
          type: 'string',
          description: '角色',
          example: 'admin',
        },
        email: {
          type: 'string',
          description: '邮箱',
          example: 'john@example.com',
        },
        gender: {
          type: 'string',
          description: '性别',
          example: '男',
        },
        mobile: {
          type: 'string',
          description: '手机号',
          example: '13800138000',
        },
        bio: {
          type: 'string',
          description: '个人简介',
          example: '这是一个简短的个人介绍',
        },
        birthday: {
          type: 'string',
          description: '生日',
          example: '1990-01-01',
        },
        city: {
          type: 'string',
          description: '所在城市',
          example: '北京市',
        },
        profession: {
          type: 'string',
          description: '职业',
          example: '软件工程师',
        },
        authId: {
          type: 'string',
          description: '认证ID',
          example: 'auth-uuid-123',
        },
        lastLoginAt: {
          type: 'string',
          description: '最后登录时间',
          example: '2023-12-01T10:00:00.000Z',
        },
        lastLoginIp: {
          type: 'string',
          description: '最后登录IP',
          example: '192.168.1.100',
        },
      },
    },
  })
  @ApiBearerAuth()
  @Get('getUserInfo')
  async getUserInfo(@GetCurrentUser() user: Auth): Promise<AuthUserInfo> {
    return await this.authService.getAuthInfo(user);
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
    type: LoginResponseDto,
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
  ): Promise<AuthCreateUserResponse> {
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
          username: result.username,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: '用户创建失败',
      };
    }
  }

  /**
   * 修改密码
   *
   * 允许已登录用户修改自己的密码。需要提供当前密码进行验证。
   *
   * @param changePasswordDto 修改密码数据
   * @param req 请求对象
   * @returns 修改结果
   */
  @Put('change-password')
  @ApiOperation({
    summary: '修改密码',
    description: '允许已登录用户修改自己的密码',
  })
  @ApiResponse({
    status: 200,
    description: '密码修改成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '密码修改成功' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '密码修改失败',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '当前密码错误' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @GetCurrentUser() user: { authId: string },
  ): Promise<AuthMessageResponse> {
    try {
      return this.authService.changePassword(changePasswordDto, user.authId);
    } catch (_) {
      return {
        message: '密码修改失败',
      };
    }
  }

  /**
   * 退出登录
   */
  @ApiOperation({
    summary: '退出登录',
    description: '退出当前用户的登录状态',
  })
  @ApiResponse({
    status: 200,
    description: '退出登录成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '退出登录成功' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  @Post('logout')
  async logout(
    @GetCurrentUser() user: { authId: string },
    @Req() req: Request,
  ): Promise<AuthMessageResponse> {
    return this.authService.logout({ accessToken: req.headers.authorization }, user.authId);
  }
}
