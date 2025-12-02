import { CACHE_PREFIXES, CACHE_TOKENS, CACHE_TTL } from '@/common/constants';
import { GENDER_LABELS } from '@/common/enums/gender.enum';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { jwtOptions } from '@/config';
import { AuthMessageResponse, AuthUserInfo } from '@/modules/auth/auth.types';
import { Cache, ICacheService } from '@/shared/cache';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { isEnabled } from 'src/common/enums';
import * as svgCaptcha from 'svg-captcha';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import type {
  CaptchaResponseDto,
  CaptchaVerifyDto,
  CaptchaVerifyResponseDto,
} from './dto/captcha-verify.dto';
import type { LoginDto, LoginResponseDto } from './dto/login.dto';
import type {
  ChangePasswordDto,
  RegisterDto,
  RegisterResponseDto,
  ResetPasswordDto,
} from './dto/register.dto';
import type {
  JwtPayloadDto,
  LogoutDto,
  LogoutResponseDto,
  RefreshTokenDto,
  TokenResponseDto,
  ValidateTokenDto,
  ValidateTokenResponseDto,
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
  @Cache({ key: `${CACHE_PREFIXES.USER_INFO}:\${0.id}`, ttl: CACHE_TTL.USER_INFO })
  async getAuthInfo(auth: Auth): Promise<AuthUserInfo> {
    // 从数据库查询完整的认证和用户信息
    const authWithUser = await this.authRepository.findOne({
      where: { id: auth.id },
      relations: ['user'],
    });

    if (!authWithUser) {
      throw BusinessExceptionFactory.notFound('用户信息不存在');
    }

    return {
      userId: authWithUser.user?.id || authWithUser.id,
      username: authWithUser.username,
      nickname: authWithUser.user?.nickname || authWithUser.username,
      avatar: authWithUser.user?.avatar || '',
      roles: authWithUser.user?.roles || 'USER',
      email: authWithUser.user?.email || '',
      gender: authWithUser.user?.gender !== undefined ? String(authWithUser.user.gender) : '',
      mobile: authWithUser.user?.mobile || '',
      bio: authWithUser.user?.bio || '',
      birthday: authWithUser.user?.birthday,
      city: authWithUser.user?.city || '',
      profession: authWithUser.user?.profession || '',
      authId: authWithUser.id,
      lastLoginAt: authWithUser.lastLoginAt,
      lastLoginIp: authWithUser.lastLoginIp ?? '',
    };
  }

  /**
   * 用户登录
   *
   * 验证用户凭据并生成JWT令牌，包含登录安全控制
   *
   * @param loginDto 包含用户名、密码等登录数据
   * @returns 成功时返回完整的登录响应信息
   * @throws UnauthorizedException 认证失败
   * @throws BadRequestException 账号被锁定或其他业务错误
   */
  async login(loginDto: LoginDto, clientIp?: string): Promise<LoginResponseDto> {
    // 查找认证记录，包含关联的用户信息
    const auth = await this.authRepository.findOne({
      where: { username: loginDto.username },
      relations: ['user'],
    });

    if (!auth) {
      // 记录登录失败尝试（可选：防止用户名枚举攻击）
      throw BusinessExceptionFactory.forbidden('登录', {
        reason: `用户${loginDto.username}不存在`,
      });
    }

    // 检查账号是否被锁定
    if (auth.isLocked()) {
      if (auth.lockedAt) {
        const lockTime = new Date(auth.lockedAt.getTime() + 30 * 60 * 1000); // 30分钟锁定
        if (new Date() < lockTime) {
          throw BusinessExceptionFactory.systemBusy({
            lockTime: lockTime.toLocaleString(),
            reason: '账号被锁定',
          });
        } else {
          // 锁定时间已过，解锁账号
          await this.unlockAccount(auth.id);
          auth.unlock();
        }
      }
    }

    // 验证密码
    const isPasswordValid = await this.validatePassword(
      loginDto.password,
      auth.salt,
      auth.password,
    );

    if (!isPasswordValid) {
      // 增加登录失败次数
      await this.incrementLoginAttempts(auth.id);

      // 检查是否需要锁定账号（5次失败后锁定）
      if (auth.loginAttempts + 1 >= 5) {
        await this.lockAccount(auth.id);
        throw BusinessExceptionFactory.systemBusy({
          reason: '登录失败次数过多，账号已被锁定30分钟',
        });
      }

      throw BusinessExceptionFactory.forbidden('登录', { reason: loginDto.username });
    }

    // 检查认证状态
    if (!isEnabled(auth.status)) {
      throw BusinessExceptionFactory.forbidden('访问', {
        reason: `用户已被禁用${loginDto.username}`,
      });
    }

    // 登录成功，重置登录失败次数
    await this.resetLoginAttempts(auth.id);

    // 更新最后登录时间
    await this.updateLastLogin(auth.id, clientIp);

    // 生成JWT令牌
    const payload = {
      sub: auth.id,
      username: auth.username,
      authId: auth.id,
      roles: auth.user?.roles || 'USER',
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(auth.id);

    // 缓存刷新令牌
    await this.cacheService.set(`${CACHE_PREFIXES.REFRESH_TOKEN}:${auth.id}`, refreshToken, {
      ttl: CACHE_TTL.REFRESH_TOKEN,
    });

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
  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
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
    await this.cacheService.del(`${CACHE_PREFIXES.USER_INFO}:${savedAuth.id}`);
    await this.cacheService.del(`${CACHE_PREFIXES.USERS}:*`);

    return {
      message: '注册成功',
      userId: savedAuth.id,
      username: savedAuth.username,
      nickname: createdUser.nickname,
      avatar: createdUser.avatar,
      email: createdUser.email,
      gender: createdUser.gender !== undefined ? GENDER_LABELS[createdUser.gender] : '',
      mobile: createdUser.mobile,
      needLogin: true,
    };
  }

  /**
   * 生成验证码
   *
   * 生成SVG格式的验证码图片和对应的令牌，支持多种验证码类型
   *
   * @param clientInfo 客户端信息（IP、User-Agent等）
   * @param type 验证码类型（login, register, reset等）
   * @returns 包含验证码图片、令牌、过期时间等信息
   */
  async generateCaptcha(
    clientInfo: Record<string, unknown>,
    _type: string = 'login',
  ): Promise<CaptchaResponseDto> {
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
    const nonce = Math.random().toString(36).substring(2, 15);
    const captchaToken = `captcha_${nonce}_${Date.now()}`;

    // 使用缓存存储验证码信息，替代 JWT token 方式
    const captchaData = {
      code: captchaCode.toLowerCase(),
      nonce,
      clientInfo,
      timestamp: Date.now(),
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
    try {
      // 从缓存中获取验证码信息
      const captchaData = await this.cacheService.get<{
        code: string;
        nonce: string;
        clientInfo: Record<string, unknown>;
        timestamp: number;
      }>(`${CACHE_PREFIXES.CAPTCHA}:${captchaVerifyDto.token}`);

      if (!captchaData) {
        return {
          success: false,
          message: '验证码无效或已过期',
        };
      }

      // 验证验证码
      if (captchaData.code !== captchaVerifyDto.code.toLowerCase()) {
        return { success: false, message: '验证码错误' };
      }

      // 验证时间戳（防止重放攻击）
      const now = Date.now();
      if (now - captchaData.timestamp > CACHE_TTL.CAPTCHA * 1000) {
        // 验证码过期
        await this.cacheService.del(`${CACHE_PREFIXES.CAPTCHA}:${captchaVerifyDto.token}`);
        return { success: false, message: '验证码已过期' };
      }

      // 验证成功后删除缓存，防止重复使用
      await this.cacheService.del(`${CACHE_PREFIXES.CAPTCHA}:${captchaVerifyDto.token}`);

      return { success: true, message: '验证成功' };
    } catch (error) {
      return {
        success: false,
        message: '验证码验证失败',
      };
    }
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
    const auth = await this.authRepository.findOne({ where: { id: authId } });
    if (!auth) {
      throw BusinessExceptionFactory.notFound('认证记录', { authId });
    }

    // 验证旧密码
    const isOldPasswordValid = await this.validatePassword(
      changePasswordDto.oldPassword,
      auth.salt,
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

    // 清除相关缓存
    await this.cacheService.del(`${CACHE_PREFIXES.USER_INFO}:${authId}`);
    await this.cacheService.del(`${CACHE_PREFIXES.REFRESH_TOKEN}:${authId}`);

    return { message: '密码修改成功' };
  }

  /**
   * 重置密码
   *
   * 通过重置令牌重置用户密码
   *
   * @param resetPasswordDto 重置密码数据
   * @returns 重置结果
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<AuthMessageResponse> {
    // 验证重置令牌
    const tokenData = await this.cacheService.get<{
      authId: string;
      username: string;
      timestamp: number;
    }>(`${CACHE_PREFIXES.RESET_TOKEN}:${resetPasswordDto.resetToken}`);

    if (!tokenData) {
      throw BusinessExceptionFactory.invalidParameter('重置令牌', { reason: '无效或已过期' });
    }

    // 检查令牌是否过期（30分钟有效期）
    const now = Date.now();
    if (now - tokenData.timestamp > 30 * 60 * 1000) {
      await this.cacheService.del(`${CACHE_PREFIXES.RESET_TOKEN}:${resetPasswordDto.resetToken}`);
      throw BusinessExceptionFactory.invalidParameter('重置令牌', { reason: '已过期' });
    }

    // 验证用户名是否匹配
    if (tokenData.username !== resetPasswordDto.username) {
      throw BusinessExceptionFactory.invalidParameter('用户名', { reason: '与重置令牌不匹配' });
    }

    // 生成新的盐值和密码哈希
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(resetPasswordDto.newPassword, salt);

    // 更新密码并解锁账号
    await this.authRepository.update(tokenData.authId, {
      password: hashedPassword,
      salt,
      isLocked: false,
      loginAttempts: 0,
      passwordChangedAt: new Date(),
    });

    // 清除重置令牌和相关缓存
    await this.cacheService.del(`${CACHE_PREFIXES.RESET_TOKEN}:${resetPasswordDto.resetToken}`);
    await this.cacheService.del(`${CACHE_PREFIXES.USER_INFO}:${tokenData.authId}`);
    await this.cacheService.del(`${CACHE_PREFIXES.REFRESH_TOKEN}:${tokenData.authId}`);

    return { message: '密码重置成功' };
  }

  /**
   * 刷新访问令牌
   *
   * 使用有效的刷新令牌生成新的访问令牌
   *
   * @param refreshTokenDto 刷新令牌数据
   * @returns 新的令牌信息
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto> {
    const { refreshToken } = refreshTokenDto;

    // 从缓存中验证刷新令牌
    const authId = await this.validateRefreshToken(refreshToken);
    if (!authId) {
      throw BusinessExceptionFactory.forbidden('令牌刷新', { reason: '刷新令牌无效或已过期' });
    }

    // 获取认证信息
    const auth = await this.authRepository.findOne({
      where: { id: authId },
      relations: ['user'],
    });

    if (!auth) {
      throw BusinessExceptionFactory.notFound('认证记录', { reason: `认证ID ${authId} 不存在` });
    }

    // 检查账号状态
    if (auth.isLocked()) {
      throw BusinessExceptionFactory.forbidden('访问', {
        reason: `账号已被锁定，认证ID ${authId}`,
      });
    }

    if (!isEnabled(auth.status)) {
      throw BusinessExceptionFactory.forbidden('访问', {
        reason: `用户已被禁用，认证ID ${authId}`,
      });
    }

    // 生成新的访问令牌
    const payload = {
      sub: auth.id,
      username: auth.username,
      authId: auth.id,
      roles: 'USER',
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
   * 验证JWT令牌
   *
   * 验证访问令牌的有效性
   *
   * @param validateTokenDto 令牌验证数据
   * @returns 验证结果和用户信息
   */
  async validateToken(validateTokenDto: ValidateTokenDto): Promise<ValidateTokenResponseDto> {
    try {
      const { token } = validateTokenDto;
      const payload = this.jwtService.verify<JwtPayloadDto>(token);

      // 获取认证信息
      const auth = await this.authRepository.findOne({
        where: { id: payload.authId },
        relations: ['user'],
      });

      if (!auth) {
        return {
          valid: false,
          expired: false,
          message: '认证记录不存在',
        };
      }

      // 检查账号状态
      if (auth.isLocked()) {
        return {
          valid: false,
          expired: false,
          message: '账号已被锁定',
        };
      }

      if (!isEnabled(auth.status)) {
        return {
          valid: false,
          expired: false,
          message: '用户已被禁用',
        };
      }

      return {
        valid: true,
        expired: false,
        message: '令牌有效',
        user: {
          id: auth.id,
          username: auth.username,
          email: auth.user?.email || '',
        },
        payload,
      };
    } catch (error) {
      return {
        valid: false,
        expired: true,
        message: '令牌无效或已过期',
      };
    }
  }

  /**
   * 用户登出
   *
   * 撤销用户的访问令牌和刷新令牌
   *
   * @param logoutDto 登出数据
   * @param authId 认证ID
   * @returns 登出结果
   */
  async logout(logoutDto: LogoutDto, authId: string): Promise<LogoutResponseDto> {
    // 清除刷新令牌缓存
    await this.cacheService.del(`${CACHE_PREFIXES.REFRESH_TOKEN}:${authId}`);

    // 清除用户信息缓存
    await this.cacheService.del(`${CACHE_PREFIXES.USER_INFO}:${authId}`);

    // 如果提供了访问令牌，将其加入黑名单
    if (logoutDto.accessToken) {
      try {
        const payload = this.jwtService.verify<JwtPayloadDto>(logoutDto.accessToken);
        const remainingTtl = payload.exp - Math.floor(Date.now() / 1000);

        if (remainingTtl > 0) {
          await this.cacheService.set(
            `${CACHE_PREFIXES.BLACKLIST_TOKEN}:${logoutDto.accessToken}`,
            'blacklisted',
            { ttl: remainingTtl },
          );
        }
      } catch (error) {
        // 令牌无效或已过期，无需加入黑名单
      }
    }

    return {
      message: '登出成功',
      loggedOut: true,
    };
  }

  /**
   * 根据认证ID获取认证信息
   *
   * 从数据库中查询指定ID的认证信息，包含关联的用户信息
   *
   * @param authId 认证ID
   * @returns 认证信息或抛出异常
   */
  @Cache({ key: `${CACHE_PREFIXES.USER_INFO}:\${0}`, ttl: CACHE_TTL.USER_INFO })
  async getAuthById(authId: string): Promise<Auth> {
    const auth = await this.authRepository.findOne({
      where: { id: authId },
      relations: ['user'],
    });
    if (!auth) {
      throw BusinessExceptionFactory.notFound('认证记录', { authId });
    }
    return auth;
  }

  /**
   * 根据用户名获取认证信息
   *
   * @param username 用户名
   * @returns 认证信息或null
   */
  async getAuthByUsername(username: string): Promise<Auth | null> {
    return this.authRepository.findOne({
      where: { username: username },
      relations: ['user'],
    });
  }

  /**
   * 检查用户名是否已存在
   *
   * @param username 用户名
   * @returns 是否存在
   */
  async isUsernameExists(username: string): Promise<boolean> {
    const count = await this.authRepository.count({
      where: { username: username },
    });
    return count > 0;
  }

  /**
   * 验证密码
   *
   * 使用bcrypt验证输入密码与存储密码是否匹配
   *
   * @param inputPassword 用户输入的密码
   * @param storedSalt 存储的盐值
   * @param storedPassword 存储的加密密码
   * @returns 密码是否匹配
   */
  private async validatePassword(
    inputPassword: string,
    storedSalt: string,
    storedPassword: string,
  ): Promise<boolean> {
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
    const timestamp = Date.now().toString();
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
