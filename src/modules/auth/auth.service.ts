import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import { Repository } from 'typeorm';
import { randomString, getCurrentTimestamp } from 'src/utils';
import { JwtService } from '@nestjs/jwt';
import { appConfig } from 'src/config';
import * as svgCaptcha from 'svg-captcha';
import * as bcryptjs from 'bcryptjs';
import * as crypto from 'crypto';

/**
 * 认证服务类
 *
 * 提供用户认证相关的核心功能，包括：
 * - 用户登录/注册
 * - JWT令牌管理
 * - 验证码生成和验证（无状态实现）
 * - 密码加密和验证
 * - 用户信息管理
 *
 * 特性：
 * - 支持防爬机制的验证码系统
 * - 无状态验证码实现（基于JWT）
 * - 安全的密码处理
 * - 防重放攻击保护
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Auth)
    private authRepository: Repository<Auth>,
    private JwtService: JwtService,
  ) {}

  /**
   * 获取用户信息
   *
   * @param user 用户数据传输对象
   * @returns 包含用户权限、角色、ID和用户名的信息对象
   */
  getUserInfo(user: CreateAuthDto) {
    return {
      buttons: ['B_CODE1', 'B_CODE2', 'B_CODE3'],
      roles: new Array<string>(user.roles),
      userId: user.id,
      userName: user.nickname,
    };
  }

  /**
   * 用户登录
   *
   * 验证用户凭据并生成JWT令牌
   *
   * @param body 包含用户名和密码的登录数据
   * @returns 成功时返回token和refreshToken，失败时返回错误消息
   */
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
      secret: appConfig.jwtOptions.secret,
    });
    return {
      token: token,
      refreshToken: token,
    };
  }

  /**
   * 用户注册
   *
   * 创建新用户账号，检查用户名是否已存在
   *
   * @param body 包含用户注册信息的数据传输对象
   * @returns 注册结果消息
   */
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
    const nonce = randomString(13);

    // 生成验证码token，包含验证码答案和安全信息
    const captchaToken = await this.JwtService.signAsync(
      {
        code: captcha.text.toLowerCase(), // 统一转小写便于验证
        timestamp: getCurrentTimestamp(),
        nonce, // 防重放攻击
        type: 'captcha',
        // 可选：记录客户端信息用于安全验证
        clientHash: clientInfo ? this.hashClientInfo(clientInfo) : null,
      },
      {
        expiresIn: '5m', // 验证码5分钟过期
      },
    );

    // 将SVG转换为base64编码，添加正确的数据URI前缀
    const svgBuffer = Buffer.from(captcha.data);
    const base64Image = `data:image/svg+xml;base64,${svgBuffer.toString('base64')}`;

    return {
      captchaImage: base64Image,
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
      const payload = await this.JwtService.verifyAsync(captchaToken);

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
    } catch {
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
