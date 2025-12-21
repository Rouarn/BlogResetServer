import { CACHE_PREFIXES, CACHE_TOKENS, CACHE_TTL } from '@/common/constants';
import { CurrentUser } from '@/common/decorators';
import { isEnabled } from '@/common/enums';
import { GENDER_LABELS } from '@/common/enums/gender.enum';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { jwtOptions } from '@/config';
import { ICacheService } from '@/shared/cache';
import { formatISOString, getCurrentTimestamp, isExpired } from '@/utils/helpers';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as svgCaptcha from 'svg-captcha';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import type {
  CaptchaResponseDto,
  CaptchaVerifyDto,
  CaptchaVerifyResponseDto,
} from './dto/captcha.dto';
import { KickUserDto } from './dto/kick-user.dto';
import type { LoginDto } from './dto/login.dto';
import { AuthMessageResponse } from './dto/message.dto';
import { OnlineSessionDto, OnlineUserDto } from './dto/online-user.dto';
import { ChangePasswordDto } from './dto/password.dto';
import { AuthCreateUserResponse, RegisterDto } from './dto/register.dto';
import type {
  JwtPayloadDto,
  LogoutResponseDto,
  RefreshTokenDto,
  TokenResponseDto,
} from './dto/token.dto';
import { Auth } from './entities/auth.entity';

/**
 * 认证服务（AuthService）
 *
 * 专注于用户认证相关的核心业务逻辑，与用户管理功能完全分离。
 *
 * 核心功能：
 * - 用户登录验证：校验用户名密码，生成JWT令牌
 * - 用户注册：创建新认证账号，与用户资料分离
 * - 密码管理：修改密码、重置密码等安全操作
 * - 验证码生成与校验：提供图形验证码防护
 * - JWT令牌管理：生成、刷新、验证、撤销访问令牌
 * - 登录安全：登录尝试次数限制、账号锁定等
 *
 * 架构设计：
 * - 仅处理认证相关逻辑，不涉及用户资料管理
 * - 通过UsersService协作处理用户资料操作
 * - Auth实体专注于认证信息存储
 * - 支持一对一关联到User实体
 *
 * 依赖项：
 * - Repository<Auth>: 认证数据仓库
 * - JwtService: JWT令牌服务
 * - UsersService: 用户管理服务（协作）
 * - ICacheService: 缓存服务
 *
 * 安全特性：
 * - bcrypt密码加密存储
 * - 盐值随机生成
 * - JWT令牌过期管理
 * - 登录失败次数限制
 * - 账号自动锁定机制
 * - 验证码防机器人攻击
 * - 刷新令牌轮换
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
    const cacheKey = `${CACHE_PREFIXES.AUTHS}:${auth.authId}`;
    const cached = await this.cacheService.get<Auth>(cacheKey);
    if (cached) {
      return cached['user'];
    }
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
  async login(
    loginDto: LoginDto,
    clientIp?: string,
    userAgent?: string,
  ): Promise<TokenResponseDto> {
    // 查找认证记录，包含关联的用户信息，并显式选择密码和盐值
    const auth = await this.authRepository
      .createQueryBuilder('auth')
      .leftJoinAndSelect('auth.user', 'user')
      .addSelect(['auth.password', 'auth.salt'])
      .where('auth.username = :username', { username: loginDto.username })
      .getOne();

    console.log('auth: ', auth);
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
      roles: auth.user?.roles || 'USER',
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(auth.id);

    // 缓存刷新令牌
    await this.cacheService.set(`${CACHE_PREFIXES.REFRESH_TOKEN}:${auth.id}`, refreshToken, {
      ttl: CACHE_TTL.REFRESH_TOKEN,
    });

    // 缓存用户信息
    // 排除敏感字段
    const { password, salt, ...authInfo } = auth;
    await this.cacheService.set(`${CACHE_PREFIXES.AUTHS}:${auth.id}`, authInfo, {
      ttl: CACHE_TTL.AUTHS,
    });

    // 缓存用户信息
    await this.cacheService.set(`${CACHE_PREFIXES.USERS}:${auth.user.id}`, auth.user, {
      ttl: CACHE_TTL.USER_LIST,
    });

    // 记录在线状态
    await this.cacheOnlineUser(auth, accessToken, clientIp, userAgent);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: jwtOptions.expiresIn,
      refreshExpiresIn: CACHE_TTL.REFRESH_TOKEN,
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
    const createdUser = await this.usersService.create({
      authId: savedAuth.id,
      nickname: registerDto.nickname ?? savedAuth.username, // 如果没有昵称，使用用户名
      email: registerDto.email,
      avatar: registerDto.avatar,
      gender: registerDto.gender,
      mobile: registerDto.mobile,
    });

    // 清除相关缓存
    await this.cacheService.del(`${CACHE_PREFIXES.AUTHS}:${savedAuth.id}`);
    await this.cacheService.del(`${CACHE_PREFIXES.USERS}:*`);

    return {
      message: '注册成功',
      data: {
        userId: savedAuth.id,
        username: savedAuth.username,
        nickname: createdUser.nickname,
        avatar: createdUser.avatar,
        email: createdUser.email,
        gender: GENDER_LABELS[createdUser.gender],
        mobile: createdUser.mobile,
      },
    };
  }

  /**
   * 生成验证码
   *
   * 生成SVG格式的验证码图片和对应的令牌，支持多种验证码类型
   *
   * @param clientInfo 客户端信息（IP、User-Agent等）
   * @returns 包含验证码图片、令牌、过期时间等信息
   */
  async generateCaptcha(clientInfo: Record<string, unknown>): Promise<CaptchaResponseDto> {
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

    const captchaCode = captcha.text; // 验证码文本
    const captchaToken = `captcha_${crypto.randomBytes(16).toString('hex')}`;

    // 使用缓存存储验证码信息，替代 JWT token 方式
    const captchaData = {
      code: captchaCode.toLowerCase(),
      clientInfo,
      timestamp: getCurrentTimestamp(),
    };

    // 存储到缓存中，5分钟过期
    await this.cacheService.set(`${CACHE_PREFIXES.CAPTCHA}:${captchaToken}`, captchaData, {
      ttl: CACHE_TTL.CAPTCHA,
    });

    // 将SVG验证码转换为base64格式的图片
    const captchaImage = `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`;

    return {
      image: captchaImage,
      token: captchaToken,
      expiresIn: CACHE_TTL.CAPTCHA, // 5分钟
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
    // 从缓存中获取验证码信息
    const captchaData = await this.cacheService.get<{
      code: string;
      clientInfo: Record<string, unknown>;
      timestamp: number;
    }>(`${CACHE_PREFIXES.CAPTCHA}:${captchaVerifyDto.token}`);

    if (!captchaData) {
      throw BusinessExceptionFactory.systemBusy({
        message: '验证码无效或已过期',
      });
    }

    // 验证验证码
    if (captchaData.code !== captchaVerifyDto.code.toLowerCase()) {
      throw BusinessExceptionFactory.validation('验证码错误');
    }

    // 验证时间戳（防止重放攻击）
    if (isExpired(captchaData.timestamp, CACHE_TTL.CAPTCHA * 1000)) {
      // 验证码过期
      await this.cacheService.del(`${CACHE_PREFIXES.CAPTCHA}:${captchaVerifyDto.token}`);
      throw BusinessExceptionFactory.validation('验证码已过期');
    }

    // 验证成功后删除缓存，防止重复使用
    await this.cacheService.del(`${CACHE_PREFIXES.CAPTCHA}:${captchaVerifyDto.token}`);

    return { success: true, message: '验证成功' };
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
  ): Promise<AuthMessageResponse> {
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

    // 清除用户相关缓存
    await this.cacheService.del(`${CACHE_PREFIXES.AUTHS}:${authId}`);
    await this.cacheService.del(`${CACHE_PREFIXES.REFRESH_TOKEN}:${authId}`);

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

    // 从缓存中验证刷新令牌
    const authId = await this.validateRefreshToken(refreshToken);
    if (!authId) {
      throw BusinessExceptionFactory.unauthorized('令牌刷新', { status: 'invalid_or_expired' });
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
      roles: auth.user?.roles || 'USER',
    };

    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.generateRefreshToken(auth.id);

    // 更新缓存中的刷新令牌
    await this.cacheService.del(`${CACHE_PREFIXES.REFRESH_TOKEN}:${auth.id}`);
    await this.cacheService.set(`${CACHE_PREFIXES.REFRESH_TOKEN}:${auth.id}`, newRefreshToken, {
      ttl: CACHE_TTL.REFRESH_TOKEN,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      expiresIn: jwtOptions.expiresIn,
      refreshExpiresIn: CACHE_TTL.REFRESH_TOKEN,
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
  async logout(currentUser: CurrentUser): Promise<LogoutResponseDto> {
    // 清除刷新令牌缓存
    await this.cacheService.del(`${CACHE_PREFIXES.REFRESH_TOKEN}:${currentUser.authId}`);

    // 清除用户信息缓存
    await this.cacheService.del(`${CACHE_PREFIXES.AUTHS}:${currentUser.authId}`);
    await this.cacheService.del(`${CACHE_PREFIXES.USERS}:${currentUser.userId}`);

    // 清除在线用户缓存
    await this.cacheService.del(`${CACHE_PREFIXES.ONLINE_USER}:${currentUser.userId}`);

    return { message: '登出成功' };
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
    const cacheKey = `${CACHE_PREFIXES.AUTHS}:${authId}`;
    const cached = await this.cacheService.get<Auth>(cacheKey);
    if (cached) {
      return Object.assign(new Auth(), cached);
    }
    const auth = await this.authRepository.findOne({
      where: { id: authId },
      relations: ['user'],
    });
    if (!auth) {
      throw BusinessExceptionFactory.notFound('认证记录', { reason: `认证ID ${authId} 不存在` });
    }
    await this.cacheService.set<Auth>(cacheKey, auth, { ttl: CACHE_TTL.AUTHS });
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
    try {
      // 解码刷新令牌
      const decoded = Buffer.from(refreshToken, 'base64url').toString();
      const [authId] = decoded.split(':');

      if (!authId) {
        return null;
      }

      // 从缓存中验证令牌
      const cachedToken = await this.cacheService.get<string>(
        `${CACHE_PREFIXES.REFRESH_TOKEN}:${authId}`,
      );

      if (cachedToken !== refreshToken) {
        return null;
      }

      return authId;
    } catch (error) {
      return null;
    }
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

  /**
   * 记录在线用户状态
   */
  private async cacheOnlineUser(
    auth: Auth,
    token: string,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    const tokenSignature = crypto.createHash('md5').update(token).digest('hex');
    const key = `${CACHE_PREFIXES.ONLINE_USER}:${auth.user.id}:${tokenSignature}`;

    const session: OnlineSessionDto = {
      ip: ip ?? '',
      userAgent: userAgent ?? '',
      loginAt: formatISOString(),
      key,
      userId: auth.user.id,
      username: auth.user.nickname,
      token,
      tokenSignature,
    };

    const decoded = this.jwtService.decode<JwtPayloadDto>(token);

    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.cacheService.set(key, session, { ttl });
      }
    }
  }

  /**
   * 获取所有在线用户
   */
  async getOnlineUsers(): Promise<OnlineUserDto[]> {
    const keys = await this.cacheService.keys(`${CACHE_PREFIXES.ONLINE_USER}:*`);
    const usersMap = new Map<string, OnlineUserDto>();

    for (const key of keys) {
      const data = await this.cacheService.get<OnlineSessionDto>(key);
      if (!data) continue;

      if (!usersMap.has(data.userId)) {
        usersMap.set(data.userId, {
          userId: data.userId,
          username: data.username,
          sessions: [],
        });
      }

      usersMap.get(data.userId)?.sessions.push({
        ip: data.ip,
        userAgent: data.userAgent,
        loginAt: data.loginAt,
        key: data.key,
        userId: data.userId,
        username: data.username,
        token: data.token,
        tokenSignature: data.tokenSignature,
      });
    }

    return Array.from(usersMap.values());
  }

  /**
   * 强制下线用户
   */
  async kickUser(kickDto: KickUserDto): Promise<void> {
    if (kickDto.tokenSignature) {
      const key = `${CACHE_PREFIXES.ONLINE_USER}:${kickDto.userId}`;
      await this.kickSession(key);
    } else {
      const keys = await this.cacheService.keys(
        `${CACHE_PREFIXES.ONLINE_USER}:${kickDto.userId}:*`,
      );
      for (const key of keys) {
        await this.kickSession(key);
      }
    }
  }

  private async kickSession(key: string): Promise<void> {
    const data = await this.cacheService.get<OnlineSessionDto>(key);

    // 清除用户相关缓存
    await this.cacheService.del(`${CACHE_PREFIXES.AUTHS}:${data?.userId}`);
    await this.cacheService.del(`${CACHE_PREFIXES.REFRESH_TOKEN}:${data?.userId}`);
    await this.cacheService.del(`${CACHE_PREFIXES.USERS}:${data?.userId}`);

    await this.cacheService.del(key);
  }
}
