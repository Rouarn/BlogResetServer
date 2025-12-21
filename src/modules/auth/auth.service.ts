import { CACHE_PREFIXES, CACHE_TOKENS, CACHE_TTL } from '@/common/constants';
import { CurrentUser } from '@/common/decorators';
import { isEnabled, Role } from '@/common/enums';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { jwtOptions } from '@/config';
import { ICacheService } from '@/shared/cache';
import { getCurrentTimestamp, uuidv4 } from '@/utils/helpers';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as svgCaptcha from 'svg-captcha';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import type {
  CaptchaResponseDto,
  CaptchaVerifyDto,
  CaptchaVerifyResponseDto,
} from './dto/captcha.dto';
import type { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/password.dto';
import { AuthCreateUserResponse, RegisterDto } from './dto/register.dto';
import type { RefreshTokenDto, TokenResponseDto } from './dto/token.dto';
import { Auth } from './entities/auth.entity';

/**
 * 认证服务（AuthService）
 *
 * 专注于用户认证相关的核心业务逻辑，与用户管理功能完全分离。
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @Inject(CACHE_TOKENS.I_CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {}

  /**
   * 获取认证用户详细信息
   *
   * 从数据库查询认证用户的详细信息，包含所有非敏感字段
   *
   * @param auth 认证实体（仅用于获取ID）
   * @returns 包含用户ID、用户名、昵称、头像、角色、邮箱、性别、手机号等信息
   */
  async getAuthInfo(auth: CurrentUser): Promise<User> {
    // 从数据库查询完整的认证和用户信息
    const authWithUser = await this.authRepository.findOne({
      where: { id: auth.authId },
      relations: ['user'],
    });

    if (!authWithUser) {
      throw BusinessExceptionFactory.notFound('用户信息', { authId: auth.authId });
    }

    return authWithUser.user;
  }

  /**
   * 获取所有当前登录用户
   *
   * @returns 当前在线的用户列表
   */
  async getActiveUsers(): Promise<User[]> {
    // 获取所有用户令牌键
    const keys = await this.cacheService.keys(`${CACHE_PREFIXES.USER_TOKENS}*`);

    if (!keys || keys.length === 0) {
      return [];
    }

    // 从键中提取 authId
    const authIds = keys.map((key) => {
      return key.replace(CACHE_PREFIXES.USER_TOKENS, '');
    });

    if (authIds.length === 0) {
      return [];
    }

    // 查询对应的用户信息
    const auths = await this.authRepository.find({
      where: { id: In(authIds) },
      relations: ['user'],
    });

    // 提取并返回用户实体
    return auths.map((auth) => auth.user).filter((user) => !!user);
  }

  /**
   * 用户登录
   *
   * 验证用户凭据并生成JWT令牌，包含登录安全控制
   *
   * @param loginDto 包含用户名、密码等登录数据
   * @param clientIp 客户端IP
   * @param userAgent 用户代理
   * @returns 成功时返回完整的登录响应信息
   * @throws UnauthorizedException 认证失败
   * @throws BadRequestException 账号被锁定或其他业务错误
   */
  async login(loginDto: LoginDto, clientIp?: string): Promise<TokenResponseDto> {
    // 查找认证记录，包含关联的用户信息，并显式选择密码和盐值
    const auth = await this.authRepository
      .createQueryBuilder('auth')
      .leftJoinAndSelect('auth.user', 'user')
      .addSelect(['auth.password', 'auth.salt'])
      .where('auth.username = :username', { username: loginDto.username })
      .getOne();

    if (!auth) {
      // 记录登录失败尝试（可选：防止用户名枚举攻击）
      throw BusinessExceptionFactory.notFound('用户', { username: loginDto.username });
    }

    // 检查账号是否被锁定
    if (auth.isLocked()) {
      if (auth.lockedAt) {
        const lockTime = new Date(auth.lockedAt.getTime() + 30 * 60 * 1000); // 30分钟锁定
        if (new Date() < lockTime) {
          throw BusinessExceptionFactory.systemBusy({
            message: '账号已被锁定，请稍后重试',
            lockTime: lockTime.toLocaleString(),
            locked: true,
          });
        } else {
          // 锁定时间已过，解锁账号
          await this.unlockAccount(auth.id);
          auth.unlock();
        }
      }
    }

    // 验证密码
    const isPasswordValid = await this.validatePassword(loginDto.password, auth.password);

    if (!isPasswordValid) {
      // 增加登录失败次数
      await this.incrementLoginAttempts(auth.id);

      // 检查是否需要锁定账号（5次失败后锁定）
      if (auth.loginAttempts + 1 >= 5) {
        await this.lockAccount(auth.id);
        throw BusinessExceptionFactory.systemBusy({
          locked: true,
          durationMinutes: 30,
        });
      }

      throw BusinessExceptionFactory.validation('登录密码', { username: loginDto.username });
    }

    // 检查认证状态
    if (!isEnabled(auth.status)) {
      throw BusinessExceptionFactory.forbidden('访问被禁用', {
        username: loginDto.username,
        disabled: true,
      });
    }

    // 登录成功，重置登录失败次数
    await this.resetLoginAttempts(auth.id);

    // 更新最后登录时间
    await this.updateLastLogin(auth.id, clientIp);

    // 生成JWT令牌
    const payload = {
      username: auth.username,
      authId: auth.id,
      userId: auth.user?.id || auth.id,
      roles: auth.user?.roles || Role.USER,
      jti: uuidv4(),
    };

    // 单点登录控制：检查并移除旧的令牌
    const existingJti = await this.cacheService.get(`${CACHE_PREFIXES.USER_TOKENS}${auth.id}`);
    if (existingJti) {
      // 将旧令牌加入黑名单
      await this.cacheService.set(
        `${CACHE_PREFIXES.BLACKLIST}${auth.id}:${existingJti}`,
        getCurrentTimestamp(),
        {
          ttl: jwtOptions.expiresIn,
        },
      );
    }

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(auth.id);

    // 存储 UserToken 到缓存
    await this.cacheService.set(`${CACHE_PREFIXES.USER_TOKENS}${auth.id}`, payload.jti, {
      ttl: jwtOptions.expiresIn,
    });

    // 存储 RefreshToken 到缓存
    await this.cacheService.set(`${CACHE_PREFIXES.REFRESH_TOKENS}${auth.id}`, refreshToken, {
      ttl: CACHE_TTL.REFRESH_TOKEN,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: jwtOptions.expiresIn,
      refreshExpiresIn: CACHE_TTL.REFRESH_TOKEN, // 7 days
    };
  }

  /**
   * 用户注册
   *
   * 创建新认证账号，支持同时创建关联的用户资料
   *
   * @param registerDto 包含用户注册信息的数据传输对象
   * @returns 注册结果消息
   * @throws ConflictException 用户名已存在
   * @throws BadRequestException 注册数据验证失败
   */
  async register(registerDto: RegisterDto): Promise<AuthCreateUserResponse> {
    // 检查用户名是否已存在
    const existingAuth = await this.authRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingAuth) {
      throw BusinessExceptionFactory.conflict('用户名已存在', { username: registerDto.username });
    }

    // 创建认证记录（密码将通过@BeforeInsert钩子自动加密）
    const auth = this.authRepository.create({
      username: registerDto.username,
      password: registerDto.password, // 原始密码，将被@BeforeInsert钩子加密
      isLocked: false,
      loginAttempts: 0,
    });

    const savedAuth = await this.authRepository.save(auth);

    // 总是创建关联的用户记录，确保两个表的数据一致性
    await this.usersService.create({
      authId: savedAuth.id,
      nickname: registerDto.nickname ?? savedAuth.username, // 如果没有昵称，使用用户名
      email: registerDto.email,
      avatar: registerDto.avatar,
      gender: registerDto.gender,
      mobile: registerDto.mobile,
    });

    return { message: '注册成功' };
  }

  /**
   * 生成验证码
   *
   * 生成SVG格式的验证码图片和对应的令牌，支持多种验证码类型
   *
   * @returns 包含验证码图片、令牌、过期时间等信息
   */
  async generateCaptcha(): Promise<CaptchaResponseDto> {
    // 创建验证码，设置选项使其更安全
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      ignoreChars: '0o1il', // 排除容易混淆的字符
      noise: 3, // 干扰线条数量
      color: true, // 文字颜色
      background: '#f0f0f0', // 背景色
      width: 120,
      height: 40,
      fontSize: 36,
    });

    const captchaToken = `captcha_${crypto.createHash('md5').update(captcha.text.toLowerCase()).digest('hex')}_${crypto.randomBytes(16).toString('hex')}`;

    // 将SVG验证码转换为base64格式的图片
    const captchaImage = `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`;

    return {
      image: captchaImage,
      token: captchaToken,
    };
  }

  /**
   * 验证验证码
   *
   * 校验用户输入的验证码是否正确
   *
   * @param captchaVerifyDto 验证码验证数据
   * @returns 验证结果
   */
  async verifyCaptcha(captchaVerifyDto: CaptchaVerifyDto): Promise<CaptchaVerifyResponseDto> {
    // 验证验证码逻辑
    const { token, code } = captchaVerifyDto;

    if (!token || !code) {
      throw BusinessExceptionFactory.invalidParameter('验证码token和code不能为空');
    }

    // 从token中提取验证码文本
    const storedToken = token.split('_')[1];

    // 比较验证码文本是否匹配
    if (storedToken !== crypto.createHash('md5').update(code.toLowerCase()).digest('hex')) {
      throw BusinessExceptionFactory.validation('验证码错误');
    }

    return { message: '验证成功' };
  }

  /**
   * 修改密码
   *
   * 验证旧密码并设置新密码
   *
   * @param changePasswordDto 修改密码数据
   * @param authId 认证ID
   * @returns 修改结果
   */
  async changePassword(
    changePasswordDto: ChangePasswordDto,
    authId: string,
  ): Promise<{ message: string }> {
    // 显式选择密码和盐值用于验证
    const auth = await this.authRepository
      .createQueryBuilder('auth')
      .addSelect(['auth.password', 'auth.salt'])
      .where('auth.id = :id', { id: authId })
      .getOne();

    if (!auth) {
      throw BusinessExceptionFactory.notFound('认证记录', { authId });
    }

    // 验证旧密码
    const isOldPasswordValid = await this.validatePassword(
      changePasswordDto.oldPassword,
      auth.password,
    );

    if (!isOldPasswordValid) {
      throw BusinessExceptionFactory.validation('旧密码错误');
    }

    // 生成新的盐值和密码哈希
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(changePasswordDto.newPassword, salt);

    // 更新密码
    await this.authRepository.update(authId, {
      password: hashedPassword,
      salt,
      passwordChangedAt: new Date(),
    });

    return { message: '密码修改成功' };
  }

  /**
   * 刷新访问令牌
   *
   * 使用有效地刷新令牌生成新的访问令牌
   *
   * @param refreshTokenDto 刷新令牌数据
   * @returns 新的令牌信息
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto> {
    const { refreshToken } = refreshTokenDto;

    // 验证刷新令牌
    const authId = await this.validateRefreshToken(refreshToken);
    if (!authId) {
      throw BusinessExceptionFactory.unauthorized('令牌刷新');
    }

    // 获取认证信息
    const auth = await this.authRepository.findOne({
      where: { id: authId },
      relations: ['user'],
    });

    if (!auth) {
      throw BusinessExceptionFactory.notFound('认证记录', { authId });
    }

    // 检查账号状态
    if (auth.isLocked()) {
      throw BusinessExceptionFactory.forbidden('账户被锁定', {
        authId,
        locked: true,
      });
    }

    if (!isEnabled(auth.status)) {
      throw BusinessExceptionFactory.forbidden('用户已被禁用', {
        authId,
        disabled: true,
      });
    }

    // 生成新的访问令牌
    const payload = {
      authId: auth.id,
      username: auth.username,
      userId: auth.user?.id || auth.id,
      roles: auth.user?.roles || Role.USER,
      jti: uuidv4(),
    };

    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.generateRefreshToken(auth.id);

    // 更新 UserToken 到缓存
    await this.cacheService.set(`${CACHE_PREFIXES.USER_TOKENS}${auth.id}`, payload.jti, {
      ttl: jwtOptions.expiresIn,
    });

    // 更新 RefreshToken 到缓存
    await this.cacheService.set(`${CACHE_PREFIXES.REFRESH_TOKENS}${auth.id}`, newRefreshToken, {
      ttl: CACHE_TTL.REFRESH_TOKEN,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      expiresIn: jwtOptions.expiresIn,
      refreshExpiresIn: CACHE_TTL.REFRESH_TOKEN, // 7天
    };
  }

  /**
   * 用户登出
   *
   * 撤销用户的访问令牌和刷新令牌
   *
   * @param currentUser 当前用户信息
   * @returns 登出结果
   */
  async logout(token: string): Promise<{ message: string }> {
    const tokenPayload = this.jwtService.decode<
      CurrentUser & { jti: string; exp: number; iat: number }
    >(token);

    if (!tokenPayload) {
      throw BusinessExceptionFactory.unauthorized('令牌无效');
    }

    // 计算过期时间
    const expiresIn = tokenPayload.exp - tokenPayload.iat;

    await this.cacheService.set(
      `${CACHE_PREFIXES.BLACKLIST}${tokenPayload.authId}:${tokenPayload.jti}`,
      getCurrentTimestamp(),
      {
        ttl: expiresIn,
      },
    );

    // 清除 Refresh Token
    await this.cacheService.del(`${CACHE_PREFIXES.REFRESH_TOKENS}${tokenPayload.authId}`);

    return { message: '退出登录成功' };
  }

  /**
   * 踢出指定用户 (管理员操作)
   *
   * @param authId 认证ID
   */
  async kickOutUserById(authId: string): Promise<void> {
    const currentJti = await this.cacheService.get(`${CACHE_PREFIXES.USER_TOKENS}${authId}`);

    if (currentJti) {
      await this.cacheService.set(
        `${CACHE_PREFIXES.BLACKLIST}${authId}:${currentJti}`,
        getCurrentTimestamp(),
        {
          ttl: jwtOptions.expiresIn,
        },
      );
      // 清除用户当前令牌记录
      await this.cacheService.del(`${CACHE_PREFIXES.USER_TOKENS}${authId}`);
    }

    // 清除 Refresh Token，防止用户立即刷新令牌
    await this.cacheService.del(`${CACHE_PREFIXES.REFRESH_TOKENS}${authId}`);
  }

  /**
   * 根据认证ID获取认证信息
   *
   * 从数据库中查询指定ID的认证信息，包含关联的用户信息
   *
   * @param authId 认证ID
   * @returns 认证信息或抛出异常
   */
  async getAuthById(authId: string): Promise<Auth> {
    const auth = await this.authRepository.findOne({
      where: { id: authId },
      relations: ['user'],
    });
    if (!auth) {
      throw BusinessExceptionFactory.notFound('认证记录', { reason: `认证ID ${authId} 不存在` });
    }
    return auth;
  }

  /**
   * 验证密码
   *
   * 使用bcrypt验证输入密码与存储密码是否匹配
   *
   * @param inputPassword 用户输入的密码
   * @param storedPassword 存储的加密密码
   * @returns 密码是否匹配
   */
  private async validatePassword(inputPassword: string, storedPassword: string): Promise<boolean> {
    return await bcrypt.compare(inputPassword, storedPassword);
  }

  /**
   * 生成刷新令牌
   *
   * 为指定认证ID生成新的刷新令牌
   *
   * @param authId 认证ID
   * @returns 刷新令牌字符串
   */
  private async generateRefreshToken(authId: string): Promise<string> {
    const randomBytes = crypto.randomBytes(32);
    const timestamp = getCurrentTimestamp().toString();
    const payload = `${authId}:${timestamp}:${randomBytes.toString('hex')}`;
    return Buffer.from(payload).toString('base64url');
  }

  /**
   * 验证刷新令牌
   *
   * 验证刷新令牌的有效性并返回关联的认证ID
   *
   * @param refreshToken 刷新令牌
   * @returns 认证ID或null
   */
  private async validateRefreshToken(refreshToken: string): Promise<string | null> {
    // 解码刷新令牌
    const decoded = Buffer.from(refreshToken, 'base64url').toString();
    const [authId] = decoded.split(':');

    if (!authId) {
      return null;
    }

    // 验证是否与缓存中的令牌一致
    const storedToken = await this.cacheService.get(`${CACHE_PREFIXES.REFRESH_TOKENS}${authId}`);

    if (!storedToken || storedToken !== refreshToken) {
      return null;
    }

    return authId;
  }

  /**
   * 增加登录失败次数
   *
   * @param authId 认证ID
   */
  private async incrementLoginAttempts(authId: string): Promise<void> {
    await this.authRepository.increment({ id: authId }, 'loginAttempts', 1);
  }

  /**
   * 重置登录失败次数
   *
   * @param authId 认证ID
   */
  private async resetLoginAttempts(authId: string): Promise<void> {
    await this.authRepository.update(authId, {
      loginAttempts: 0,
    });
  }

  /**
   * 锁定账号
   *
   * @param authId 认证ID
   */
  private async lockAccount(authId: string): Promise<void> {
    await this.authRepository.update(authId, {
      lockedAt: new Date(),
    });
  }

  /**
   * 解锁账号
   *
   * @param authId 认证ID
   */
  private async unlockAccount(authId: string): Promise<void> {
    await this.authRepository.update(authId, {
      loginAttempts: 0,
      lockedAt: undefined,
    });
  }

  /**
   * 更新最后登录时间
   *
   * @param authId 认证ID
   * @param clientIp
   */
  private async updateLastLogin(authId: string, clientIp?: string): Promise<void> {
    const updateData: Partial<Auth> = {
      lastLoginAt: new Date(),
    };
    if (clientIp) {
      updateData.lastLoginIp = clientIp;
    }
    await this.authRepository.update(authId, updateData);
  }
}
