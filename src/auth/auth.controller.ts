import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
  Res,
  Session,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
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

  @Post()
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }

  @Public()
  @Post('login')
  login(@Body() body: CreateAuthDto, @Req() req: Request, @User() user: any) {
    console.log('user: ', user);
    return this.authService.login(body);
  }

  @Public()
  @Post('register')
  register(@Body() body: CreateAuthDto) {
    return this.authService.register(body);
  }
}
