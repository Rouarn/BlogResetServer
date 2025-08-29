import { Injectable, Res } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as svgCaptcha from 'svg-captcha';
import * as bcryptjs from 'bcryptjs';
import type { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Auth)
    private authRepository: Repository<Auth>,
    private JwtService: JwtService,
  ) {}

  getUserInfo(user: CreateAuthDto) {
    return {
      buttons: ['B_CODE1', 'B_CODE2', 'B_CODE3'],
      roles: new Array<string>(user.roles),
      userId: user.id,
      userName: user.nickname,
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

  /**
   * 生成验证码 - 无状态实现
   * 使用JWT token存储验证码信息，避免服务端状态管理
   * 包含防爬机制和安全增强
   */
  async generateCaptcha(clientInfo?: { ip?: string; userAgent?: string }) {
    // 生成随机复杂度的验证码（防爬机制）
    const complexity = Math.random() > 0.7 ? 5 : 4; // 30%概率生成5位验证码

    const captcha = svgCaptcha.create({
      size: complexity,
      ignoreChars: '0o1iIlL', // 避免混淆字符
      noise: Math.floor(Math.random() * 3) + 1, // 随机干扰线条
      color: true,
      width: 120,
      height: 50,
      background: `#${Math.floor(Math.random() * 16777215).toString(16)}33`, // 随机背景色
      fontSize: 45 + Math.floor(Math.random() * 10), // 随机字体大小
    });

    // 生成唯一标识符（防重放攻击）
    const nonce = Math.random().toString(36).substring(2, 15);

    // 生成验证码token，包含验证码答案和安全信息
    const captchaToken = await this.JwtService.signAsync(
      {
        code: captcha.text.toLowerCase(), // 统一转小写便于验证
        timestamp: Date.now(),
        nonce, // 防重放攻击
        type: 'captcha',
        // 可选：记录客户端信息用于安全验证
        clientHash: clientInfo ? this.hashClientInfo(clientInfo) : null,
      },
      {
        secret: process.env.NEST_JWT_SECRET,
        expiresIn: '5m', // 验证码5分钟过期
      },
    );

    return {
      captchaImage: captcha.data,
      captchaToken,
      expiresIn: 300, // 5分钟 = 300秒
      nonce, // 返回nonce供客户端使用
    };
  }

  /**
   * 生成客户端信息哈希（用于防爬验证）
   */
  private hashClientInfo(clientInfo: {
    ip?: string;
    userAgent?: string;
  }): string {
    const crypto = require('crypto');
    const info = `${clientInfo.ip || 'unknown'}-${clientInfo.userAgent || 'unknown'}`;
    return crypto
      .createHash('sha256')
      .update(info)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * 验证验证码 - 增强安全版本
   * @param captchaToken 验证码token
   * @param userInput 用户输入的验证码
   * @param clientInfo 客户端信息（可选，用于安全验证）
   */
  async verifyCaptcha(
    captchaToken: string,
    userInput: string,
    clientInfo?: { ip?: string; userAgent?: string },
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      // 验证并解析token
      const payload = await this.JwtService.verifyAsync(captchaToken, {
        secret: process.env.NEST_JWT_SECRET,
      });

      // 检查token类型
      if (payload.type !== 'captcha') {
        return { valid: false, reason: 'Invalid token type' };
      }

      // 检查时间窗口（防止重放攻击）
      const tokenAge = Date.now() - payload.timestamp;
      const maxAge = 5 * 60 * 1000; // 5分钟

      if (tokenAge > maxAge) {
        return { valid: false, reason: 'Token expired' };
      }

      // 可选：验证客户端信息（防爬机制）
      if (payload.clientHash && clientInfo) {
        const currentClientHash = this.hashClientInfo(clientInfo);
        if (payload.clientHash !== currentClientHash) {
          return { valid: false, reason: 'Client mismatch' };
        }
      }

      // 检查验证码是否匹配（不区分大小写）
      const isCodeValid = payload.code === userInput.toLowerCase();

      if (!isCodeValid) {
        return { valid: false, reason: 'Incorrect code' };
      }

      return { valid: true };
    } catch (error) {
      // token无效、过期或解析失败
      return { valid: false, reason: 'Token verification failed' };
    }
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
