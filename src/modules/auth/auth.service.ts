import { TimestampedService } from 'src/audit';
import { Status, isEnabled, toggleStatus } from 'src/common/enums';
import * as svgCaptcha from 'svg-captcha';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import { BatchDeleteUserDto, UpdateUserDto } from './dto/update-user.dto';
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
export class AuthService extends TimestampedService<Auth> {
  /**
   * 构造函数
   * @param authRepository 用户数据仓库
   * @param jwtService JWT服务实例
   */
  constructor(
    @InjectRepository(Auth)
    authRepository: Repository<Auth>,
    private readonly jwtService: JwtService,
  ) {
    super(authRepository);
  }

  /**
   * 获取用户信息
   *
   * 返回用户的权限按钮、角色列表、用户ID和用户名等信息
   *
   * @param user 用户数据传输对象
   * @returns 包含用户权限、角色、ID和用户名的信息对象
   */
  getUserInfo(user: Auth): {
    buttons: string[];
    roles: string[];
    userId: string;
    userName: string;
  } {
    return {
      buttons: ['B_CODE1', 'B_CODE2', 'B_CODE3'],
      roles: [user.roles], // roles是单个Role枚举，转换为数组
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
  async login(body: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const findUser = await this.repository.findOne({
      where: { userName: body.userName },
    });

    if (!findUser) {
      throw new Error('用户不存在');
    }

    // 检查用户状态
    if (!isEnabled(findUser.status)) {
      throw new Error('用户已被禁用');
    }

    // 验证密码
    const isPasswordValid = await this.validatePassword(
      body.password,
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
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
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
  async register(body: CreateAuthDto): Promise<{ message: string; user: Partial<Auth> }> {
    const findUser = await this.repository.findOne({
      where: { userName: body.userName },
    });

    if (findUser) {
      throw new Error('用户已存在');
    }

    // 创建用户
    const createUser = await this.repository.create(body as Partial<Auth>);
    const savedUser = await this.repository.save(createUser);

    return {
      message: '注册成功',
      user: savedUser,
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

    // 将SVG验证码转换为base64格式的图片
    const captchaImage = `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`;

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

  /**
   * 根据ID获取单个用户详情
   * @param id 用户ID
   * @returns 用户详情
   */
  async getUserById(id: string): Promise<Auth> {
    const user = await this.repository.findOne({
      where: { id },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  }

  /**
   * 获取全部用户列表
   * @param current 当前页码
   * @param size 每页数量
   * @returns 用户列表
   */
  async getAllUsers(
    current: number = 1,
    size: number = 10,
  ): Promise<{ data: Auth[]; total: number }> {
    const [data, total] = await this.repository.findAndCount({
      skip: (current - 1) * size,
      take: size,
    });
    console.log('data', data);
    return { data, total };
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param updateUserDto 更新数据
   * @returns 更新后的用户信息
   */
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<Auth> {
    const user = await this.getUserById(id);

    // 合并更新数据
    Object.assign(user, updateUserDto);

    return this.repository.save(user);
  }

  /**
   * 删除用户
   * @param id 用户ID
   * @returns 删除结果
   */
  async deleteUser(id: string): Promise<{ message: string }> {
    const user = await this.getUserById(id);

    await this.repository.remove(user);

    return { message: '用户删除成功' };
  }

  /**
   * 批量删除用户
   * @param batchDeleteDto 批量删除数据
   * @returns 删除结果
   */
  async batchDeleteUsers(
    batchDeleteDto: BatchDeleteUserDto,
  ): Promise<{ message: string; deletedCount: number }> {
    const { ids } = batchDeleteDto;

    // 查找要删除的用户
    const users = await this.repository.findByIds(ids);

    if (users.length === 0) {
      throw new Error('未找到要删除的用户');
    }

    // 执行批量删除
    await this.repository.remove(users);

    return {
      message: `成功删除 ${users.length} 个用户`,
      deletedCount: users.length,
    };
  }

  /**
   * 切换用户状态
   * @param id 用户ID
   * @param status 新状态（可选，如果不提供则自动切换）
   * @returns 更新后的用户信息
   */
  async toggleUserStatus(id: string, status?: Status): Promise<Auth> {
    const user = await this.getUserById(id);

    // 如果没有提供状态，则自动切换
    user.status = status ?? toggleStatus(user.status);

    return this.repository.save(user);
  }

  /**
   * 启用用户
   * @param id 用户ID
   * @returns 更新后的用户信息
   */
  async enableUser(id: string): Promise<Auth> {
    return this.toggleUserStatus(id, Status.ENABLED);
  }

  /**
   * 禁用用户
   * @param id 用户ID
   * @returns 更新后的用户信息
   */
  async disableUser(id: string): Promise<Auth> {
    return this.toggleUserStatus(id, Status.DISABLED);
  }

  /**
   * 检查用户是否启用
   * @param id 用户ID
   * @returns 用户是否启用
   */
  async isUserEnabled(id: string): Promise<boolean> {
    const user = await this.getUserById(id);
    return isEnabled(user.status);
  }
}
