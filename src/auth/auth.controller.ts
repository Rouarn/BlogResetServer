import {
  Get,
  Post,
  Body,
  Req,
  Controller,
  UseInterceptors,
  ClassSerializerInterceptor,
  Headers,
  Ip,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { Public } from 'src/utils/decorators/public';
import { User } from 'src/utils/decorators/user';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 获取验证码
   * 返回验证码图片和对应的token
   * 支持防爬机制
   */
  @Public()
  @Get('captcha')
  async getCaptcha(
    @Ip() clientIp: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const clientInfo = { ip: clientIp, userAgent };
    const result = await this.authService.generateCaptcha(clientInfo);

    return {
      success: true,
      data: {
        image: result.captchaImage,
        token: result.captchaToken,
        expiresIn: result.expiresIn,
        nonce: result.nonce,
      },
      message: '验证码生成成功',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 验证验证码
   * 独立的验证接口，遵循RESTful设计
   * 包含安全验证机制
   */
  @Public()
  @Post('captcha/verify')
  async verifyCaptcha(
    @Body() body: { token: string; code: string },
    @Ip() clientIp: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const { token, code } = body;

    if (!token || !code) {
      return {
        success: false,
        message: '验证码token和code不能为空',
        timestamp: new Date().toISOString(),
      };
    }

    const clientInfo = { ip: clientIp, userAgent };
    const result = await this.authService.verifyCaptcha(
      token,
      code,
      clientInfo,
    );

    return {
      success: result.valid,
      message: result.valid
        ? '验证码验证成功'
        : `验证码验证失败: ${result.reason}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('getUserInfo')
  getUserInfo(@User() user: CreateAuthDto) {
    return this.authService.getUserInfo(user);
  }

  @Public()
  @Post('login')
  login(@Body() body: CreateAuthDto) {
    return this.authService.login(body);
  }

  @Public()
  @Post('register')
  register(@Body() body: CreateAuthDto) {
    return this.authService.register(body);
  }

  /**
   * 创建用户（需要验证码验证）
   * 使用无状态验证码验证机制
   */
  @Public()
  @Post('create')
  async createUser(
    @Body()
    body: {
      captchaToken: string;
      captchaCode: string;
      [key: string]: any;
    },
    @Req() req: Request,
  ) {
    const { captchaToken, captchaCode, ...userData } = body;

    // 验证必要参数
    if (!captchaToken || !captchaCode) {
      return {
        success: false,
        message: '验证码token和验证码不能为空',
        timestamp: new Date().toISOString(),
      };
    }

    // 获取客户端信息进行安全验证
    const clientInfo = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const captchaResult = await this.authService.verifyCaptcha(
      captchaToken,
      captchaCode,
      clientInfo,
    );

    if (!captchaResult.valid) {
      return {
        success: false,
        message: `验证码验证失败: ${captchaResult.reason}`,
        timestamp: new Date().toISOString(),
      };
    }

    // 验证码通过，执行用户创建逻辑
    try {
      // 这里可以调用实际的用户创建服务
      // const result = await this.authService.createUser(userData);

      return {
        success: true,
        message: '用户创建成功',
        data: userData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: '用户创建失败',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
