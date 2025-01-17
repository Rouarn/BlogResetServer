import {
  Get,
  Post,
  Body,
  Req,
  Res,
  Session,
  Controller,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { Public } from 'src/utils/decorators/public';
import { User } from 'src/utils/decorators/user';
import type { Request, Response } from 'express';
import type { Session as sessionType } from 'express-session';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 图片验证码
  @Public()
  @Get('captcha')
  captcha(
    @Req() req: Request,
    @Res() res: Response,
    @Session() session: sessionType,
  ) {
    return this.authService.captcha(req, res, session);
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
}
