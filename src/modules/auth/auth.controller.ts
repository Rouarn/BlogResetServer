import { CurrentUser, GetCurrentUser, Public } from '@/common/decorators';
import { BusinessExceptionFactory } from '@/common/exceptions';
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
import { AuthService } from './auth.service';
import {
  CaptchaResponseDto,
  CaptchaVerifyDto,
  CaptchaVerifyResponseDto,
} from './dto/captcha-verify.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { AuthCreateUserResponse } from './dto/create-user.response';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { AuthMessageResponse } from './dto/message.dto';
import { ChangePasswordDto, RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { RefreshTokenDto, TokenResponseDto } from './dto/token.dto';
import { AuthUserInfoDto } from './dto/user-info.dto';

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
  @ApiResponse({ status: 200, description: '成功获取验证码', type: CaptchaResponseDto })
  @Public()
  @Get('captcha')
  async getCaptcha(
    @Ip() clientIp: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<CaptchaResponseDto> {
    const clientInfo = { ip: clientIp, userAgent };
    const result = await this.authService.generateCaptcha(clientInfo);

    return {
      image: result.image,
      token: result.token,
      expiresIn: result.expiresIn,
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
  @ApiResponse({ status: 200, description: '验证码验证结果', type: CaptchaVerifyResponseDto })
  @Public()
  @Post('captcha/verify')
  verifyCaptcha(@Body() body: CaptchaVerifyDto): Promise<CaptchaVerifyResponseDto> {
    const { token, code } = body;

    if (!token || !code) {
      throw BusinessExceptionFactory.invalidParameter('验证码token和code不能为空');
    }

    return this.authService.verifyCaptcha({
      token,
      code,
    });
  }

  @ApiOperation({
    summary: '获取用户信息',
    description: '获取当前登录用户的详细信息，包括权限和角色',
  })
  @ApiResponse({ status: 200, description: '成功获取用户信息', type: AuthUserInfoDto })
  @ApiBearerAuth()
  @Get('getUserInfo')
  async getUserInfo(@GetCurrentUser() user: CurrentUser): Promise<AuthUserInfoDto> {
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
  login(@Body() body: LoginDto, @Ip() clientIp: string): Promise<LoginResponseDto> {
    return this.authService.login(body, clientIp);
  }

  @ApiOperation({
    summary: '刷新令牌',
    description: '使用刷新令牌获取新的访问令牌，并进行刷新令牌轮换',
  })
  @ApiBody({
    description: '刷新令牌请求',
    type: RefreshTokenDto,
  })
  @ApiResponse({
    status: 200,
    description: '刷新成功',
    type: TokenResponseDto,
  })
  @Public()
  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.authService.refreshToken(body);
  }

  @ApiOperation({
    summary: '用户注册',
    description: '新用户注册账号',
  })
  @ApiBody({
    description: '注册请求',
    type: CreateAuthDto,
  })
  @ApiResponse({ status: 200, description: '注册结果', type: RegisterResponseDto })
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
  @ApiResponse({ status: 200, description: '用户创建结果', type: AuthCreateUserResponse })
  @Public()
  @Post('create')
  async createUser(@Body() body: RegisterDto): Promise<AuthCreateUserResponse> {
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
  @ApiResponse({ status: 200, description: '密码修改成功', type: AuthMessageResponse })
  @ApiResponse({ status: 400, description: '密码修改失败' })
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
  @ApiResponse({ status: 200, description: '退出登录成功' })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  @Post('logout')
  async logout(
    @GetCurrentUser() user: CurrentUser,
    @Req() req: Request,
  ): Promise<AuthMessageResponse> {
    return this.authService.logout({ accessToken: req.headers.authorization }, user);
  }
}
