import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAuthDto } from './dto/create-auth.dto';
import { Auth } from './entities/auth.entity';

/**
 * 认证服务（AuthService）
 *
 * 提供用户认证相关的核心业务逻辑，包括登录、注册、JWT令牌管理等功能。
 *
 * 功能说明：
 * - 用户登录验证：校验用户名密码，生成JWT令牌
 * - 用户注册：创建新用户账号，检查用户名唯一性
 * - 用户信息获取：返回用户权限、角色等信息
 * - 验证码生成与校验：提供图形验证码功能
 * - JWT令牌管理：生成、刷新、验证访问令牌
 *
 * 依赖项：
 * - Repository<Auth>: 用户数据仓库，处理数据库操作
 * - JwtService: JWT服务，用于令牌的生成和验证
 * - CreateAuthDto: 用户数据传输对象
 *
 * 安全特性：
 * - 密码加密存储和验证
 * - JWT令牌过期管理
 * - 验证码防机器人攻击
 * - 用户会话管理
 */
@Injectable()
export class AuthService {
  /**
   * 构造函数
   * @param authRepository 用户数据仓库
   * @param jwtService JWT服务实例
   */
  constructor(
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 获取用户信息
   *
   * 返回用户的权限按钮、角色列表、用户ID和用户名等信息
   *
   * @param user 用户数据传输对象
   * @returns 包含用户权限、角色、ID和用户名的信息对象
   */
  getUserInfo(user: CreateAuthDto): {
    buttons: string[];
    roles: string[];
    userId: string;
    userName: string;
  } {
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
  async login(
    body: Record<string, unknown>,
  ): Promise<{ accessToken: string; refreshToken: string; user: Record<string, unknown> }> {
    const findUser = await this.authRepository.findOne({
      where: { userName: (body as { userName: string }).userName },
    });

    if (!findUser) {
      throw new Error('用户不存在');
    }

    // 验证密码
    const isPasswordValid = await this.validatePassword(
      (body as { password: string }).password,
      findUser.salt,
      findUser.password,
    );
    if (!isPasswordValid) {
      throw new Error('密码错误');
    }

    // 生成JWT令牌
    const payload = {
      id: findUser.id,
      userName: findUser.userName,
      roles: findUser.roles,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: findUser.id,
        userName: findUser.userName,
        nickname: findUser.nickname,
        roles: findUser.roles,
      },
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
  async register(
    body: Record<string, unknown>,
  ): Promise<{ message: string; user: Record<string, unknown> }> {
    const findUser = await this.authRepository.findOne({
      where: { userName: (body as { userName: string }).userName },
    });

    if (findUser) {
      throw new Error('用户已存在');
    }

    // 创建用户
    const createUser = await this.authRepository.create(body as Partial<Auth>);
    const savedUser = await this.authRepository.save(createUser);

    return {
      message: '注册成功',
      user: {
        id: savedUser.id,
        userName: savedUser.userName,
        nickname: savedUser.nickname,
      },
    };
  }

  /**
   * 生成验证码
   *
   * 生成图形验证码和对应的令牌，用于防止机器人攻击
   *
   * @param clientInfo 客户端信息（IP、User-Agent等）
   * @returns 验证码图片、令牌、过期时间和随机数
   */
  generateCaptcha(
    clientInfo: Record<string, unknown>,
  ): Promise<{ captchaImage: string; captchaToken: string; expiresIn: number; nonce: string }> {
    // 这里应该实现实际的验证码生成逻辑
    // 为了示例，返回模拟数据
    const captchaCode = Math.random().toString(36).substring(2, 8);
    const nonce = Math.random().toString(36).substring(2, 15);

    // 生成验证码令牌（实际应该包含加密的验证码信息）
    const captchaToken = this.jwtService.sign(
      {
        code: captchaCode,
        nonce,
        clientInfo,
        timestamp: Date.now(),
      },
      { expiresIn: '5m' },
    );

    // 这里应该生成实际的验证码图片
    const captchaImage = `data:image/svg+xml;base64,${Buffer.from(
      `
      <svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
        <text x="10" y="25" font-family="Arial" font-size="20" fill="black">${captchaCode}</text>
      </svg>
    `,
    ).toString('base64')}`;

    return Promise.resolve({
      captchaImage,
      captchaToken,
      expiresIn: 300, // 5分钟
      nonce,
    });
  }

  /**
   * 验证验证码
   *
   * 校验用户输入的验证码是否正确
   *
   * @param token 验证码令牌
   * @param code 用户输入的验证码
   * @param clientInfo 客户端信息
   * @returns 验证结果
   */
  async verifyCaptcha(
    token: string,
    code: string,
    _clientInfo: Record<string, unknown>,
  ): Promise<{ success: boolean; message: string; valid?: boolean; reason?: string }> {
    try {
      const decoded = this.jwtService.verify(token);

      // 验证验证码
      if ((decoded as { code?: string }).code?.toLowerCase() !== code.toLowerCase()) {
        return { success: false, message: '验证码错误', valid: false, reason: 'Incorrect code' };
      }

      // 验证时间戳（防止重放攻击）
      const now = Date.now();
      if (now - (decoded as { timestamp?: number }).timestamp! > 300000) {
        // 5分钟过期
        return { success: false, message: '验证码已过期', valid: false, reason: 'Token expired' };
      }

      return { success: true, message: '验证成功', valid: true };
    } catch {
      return {
        success: false,
        message: '验证码无效',
        valid: false,
        reason: 'Token verification failed',
      };
    }
  }

  /**
   * 验证密码
   * @param inputPassword 输入的密码
   * @param storedSalt 存储的盐值
   * @param storedPassword 存储的密码哈希
   * @returns 验证结果
   */
  private async validatePassword(
    inputPassword: string,
    storedSalt: string,
    storedPassword: string,
  ): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    const hashedInputPassword = bcrypt.hashSync(inputPassword, storedSalt);
    return hashedInputPassword === storedPassword;
  }
}
