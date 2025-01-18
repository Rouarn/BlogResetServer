import {
  Get,
  Post,
  Body,
  Req,
  Res,
  Controller,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { Public } from 'src/utils/decorators/public';
import { User } from 'src/utils/decorators/user';
import type { Response } from 'express';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 图片验证码
  @Public()
  @Get('captcha')
  captcha(@Req() req: any, @Res() res: Response) {
    return this.authService.captcha(req, res);
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

  @Public()
  @Post('create')
  createUser(@Req() req: any, @Body() body: any) {
    console.log(req.session, body);
    if (
      req.session.code.toLocaleLowerCase() === body?.code?.toLocaleLowerCase()
    ) {
      return {
        message: '验证码正确',
      };
    } else {
      return {
        message: '验证码错误',
      };
    }
  }
}
