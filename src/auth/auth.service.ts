import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as svgCaptcha from 'svg-captcha';
import * as bcryptjs from 'bcryptjs';
import type { Request, Response } from 'express';
import type { Session } from 'express-session';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Auth)
    private authRepository: Repository<Auth>,
    private JwtService: JwtService,
  ) {}

  getUserInfo(user: CreateAuthDto) {
    console.log('user: ', user);
    return {
      buttons: ['B_CODE1', 'B_CODE2', 'B_CODE3'],
      roles: ['R_SUPER'],
      userId: '0',
      userName: 'Soybean',
    };
  }
  async login(body: CreateAuthDto) {
    const findUser = await this.authRepository.findOne({
      where: { userName: body.userName },
    });
    // 没有找到
    if (!findUser) return '用户不存在';

    // 找到了对比密码 使用 boby.salt 比较
    const compareRes: boolean = await validatePassword(
      body.password,
      findUser.salt,
      findUser.password,
    );
    // 密码不正确
    if (!compareRes) return '密码不正确';

    // 排除密码
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, salt, ...payload } = findUser;
    const token = await this.JwtService.signAsync(payload, {
      secret: process.env.NEST_JWT_SECRET,
    });
    return {
      token: token,
      refreshToken: token,
    };
  }

  async register(body: CreateAuthDto) {
    const findUser = await this.authRepository.findOne({
      where: { userName: body.userName },
    });
    // 找到了
    if (findUser) return '用户已存在';

    // 创建用户
    const createUser = await this.authRepository.create(body);

    await this.authRepository.save(createUser);
    return '注册成功';
  }

  captcha(req: Request, res: Response, session: Session & { code?: string }) {
    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: '0o1i',
      noise: 3,
      color: true,
      width: 100,
      height: 40,
    });
    session.code = captcha.text;
    res.type('image/svg+xml');
    res.send(captcha.data);

    return '验证码获取成功';
  }
}

/**
 * 异步函数用于验证密码的正确性
 *
 * 该函数通过将用户输入的密码与存储的盐和密码进行比较，以验证密码是否正确
 * 使用bcryptjs库对输入的密码进行哈希处理，并与存储的密码进行比较
 *
 * @param inputPassword 用户输入的密码
 * @param storedSalt 存储的盐值，用于哈希密码
 * @param storedPassword 存储的哈希后的密码
 * @returns 返回一个Promise，解析为布尔值，表示密码验证是否成功
 */
async function validatePassword(
  inputPassword: string,
  storedSalt: string,
  storedPassword: string,
): Promise<boolean> {
  // 使用存储的盐对输入的密码进行哈希处理
  const hashedInputPassword = bcryptjs.hashSync(inputPassword, storedSalt);
  // 比较哈希后的密码与存储的密码
  return hashedInputPassword === storedPassword;
}
