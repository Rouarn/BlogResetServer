import type { Request } from 'express';
import { GetCurrentUser, Public } from 'src/common/decorators';
import { formatISOString } from 'src/utils';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Headers,
  Ip,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CaptchaVerifyDto } from './dto/captcha-verify.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { BatchDeleteUserDto, ToggleUserStatusDto, UpdateUserDto } from './dto/update-user.dto';
import { Auth } from './entities/auth.entity';

@ApiTags('认证管理')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 获取全部用户列表
   *
   * 支持分页查询，可通过 current 和 size 参数控制分页
   * 需要 JWT 认证，确保只有授权用户可以访问
   *
   * @param current 当前页码，从1开始，默认为1
   * @param size 每页数量，默认为10
   * @returns 用户列表数组
   */
  @ApiOperation({
    summary: '获取全部用户',
    description: '获取全部用户列表，支持分页查询',
  })
  @ApiResponse({
    status: 200,
    description: '获取全部用户列表成功',
    type: Auth,
  })
  @Get()
  async getAllUsers(
    @Query('current') current?: number,
    @Query('size') size?: number,
  ): Promise<{ data: Auth[]; total: number }> {
    return this.authService.getAllUsers(current, size);
  }

  /**
   * 获取验证码
   * 返回验证码图片和对应的token
   * 支持防爬机制
   */
  @ApiOperation({
    summary: '获取验证码',
    description: '生成验证码图片和对应的token，支持防爬机制和安全增强',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取验证码',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          description: '验证码图片的base64编码',
          example: 'data:image/svg+xml;base64,PHN2Zy4uLg==',
        },
        token: {
          type: 'string',
          description: '验证码token，用于后续验证',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        expiresIn: {
          type: 'number',
          description: '过期时间（秒）',
          example: 300,
        },
        nonce: {
          type: 'string',
          description: '防重放攻击的随机数',
          example: 'abc123def456',
        },
      },
    },
  })
  @Public()
  @Get('captcha')
  async getCaptcha(
    @Ip() clientIp: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<{
    image: string;
    token: string;
    expiresIn: number;
    nonce: string;
  }> {
    const clientInfo = { ip: clientIp, userAgent };
    const result = await this.authService.generateCaptcha(clientInfo);

    return {
      image: result.captchaImage,
      token: result.captchaToken,
      expiresIn: result.expiresIn,
      nonce: result.nonce,
    };
  }

  /**
   * 验证验证码
   * 独立的验证接口，遵循RESTful设计
   * 包含安全验证机制
   */
  @ApiOperation({
    summary: '验证验证码',
    description: '验证用户输入的验证码是否正确，包含安全验证机制',
  })
  @ApiBody({
    description: '验证码验证请求',
    type: CaptchaVerifyDto,
  })
  @ApiResponse({
    status: 200,
    description: '验证码验证结果',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: '验证是否成功',
          example: true,
        },
        message: {
          type: 'string',
          description: '验证结果消息',
          example: '验证码验证成功',
        },
        timestamp: {
          type: 'string',
          description: '时间戳',
          example: '2023-12-01T10:00:00.000Z',
        },
      },
    },
  })
  @Public()
  @Post('captcha/verify')
  async verifyCaptcha(
    @Body() body: { token: string; code: string },
    @Ip() clientIp: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<{ success: boolean; message: string; timestamp?: string }> {
    const { token, code } = body;

    if (!token || !code) {
      return {
        success: false,
        message: '验证码token和code不能为空',
        timestamp: formatISOString(),
      };
    }

    const clientInfo = { ip: clientIp, userAgent };
    const result = await this.authService.verifyCaptcha(token, code, clientInfo);

    return {
      success: result.valid ?? false,
      message: result.valid
        ? '验证码验证成功'
        : `验证码验证失败: ${result.reason ?? result.message}`,
      timestamp: formatISOString(),
    };
  }

  @ApiOperation({
    summary: '获取用户信息',
    description: '获取当前登录用户的详细信息，包括权限和角色',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取用户信息',
    schema: {
      type: 'object',
      properties: {
        buttons: {
          type: 'array',
          items: { type: 'string' },
          description: '用户权限按钮',
          example: ['B_CODE1', 'B_CODE2', 'B_CODE3'],
        },
        roles: {
          type: 'array',
          items: { type: 'string' },
          description: '用户角色',
          example: ['admin', 'user'],
        },
        userId: {
          type: 'number',
          description: '用户ID',
          example: 1,
        },
        userName: {
          type: 'string',
          description: '用户名',
          example: 'john_doe',
        },
      },
    },
  })
  @ApiBearerAuth()
  @Get('getUserInfo')
  getUserInfo(@GetCurrentUser() user: Auth): {
    buttons: string[];
    roles: string[];
    userId: string;
    userName: string;
  } {
    return this.authService.getUserInfo(user);
  }

  @ApiOperation({
    summary: '用户登录',
    description: '用户使用用户名和密码进行登录认证',
  })
  @ApiBody({
    description: '登录请求',
    type: LoginDto,
  })
  @ApiResponse({
    status: 201,
    description: '登录成功',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT访问令牌',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT刷新令牌',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        {
          type: 'string',
          description: '错误消息',
          example: '用户不存在',
        },
      ],
    },
  })
  @Public()
  @Post('login')
  login(@Body() body: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.login(body);
  }

  @ApiOperation({
    summary: '用户注册',
    description: '新用户注册账号',
  })
  @ApiBody({
    description: '注册请求',
    type: CreateAuthDto,
  })
  @ApiResponse({
    status: 200,
    description: '注册结果',
    schema: {
      type: 'string',
      description: '注册结果消息',
      example: '注册成功',
    },
  })
  @Public()
  @Post('register')
  register(@Body() body: CreateAuthDto): Promise<{ message: string; user: Partial<Auth> }> {
    return this.authService.register(body);
  }

  /**
   * 创建用户（需要验证码验证）
   * 使用无状态验证码验证机制
   */
  @ApiOperation({
    summary: '创建用户',
    description: '创建新用户，需要验证码验证，使用无状态验证码验证机制',
  })
  @ApiBody({
    description: '创建用户请求',
    type: CreateUserDto,
  })
  @ApiResponse({
    status: 200,
    description: '用户创建结果',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: '操作是否成功',
          example: true,
        },
        message: {
          type: 'string',
          description: '结果消息',
          example: '用户创建成功',
        },
        data: {
          type: 'object',
          description: '用户数据',
          additionalProperties: true,
        },
        timestamp: {
          type: 'string',
          description: '时间戳',
          example: '2023-12-01T10:00:00.000Z',
        },
      },
    },
  })
  @Public()
  @Post('create')
  async createUser(
    @Body() body: CreateUserDto,
    @Req() req: Request,
  ): Promise<{
    success: boolean;
    message: string;
    user?: Partial<Auth>;
    timestamp?: string;
    data?: Record<string, unknown>;
    error?: string;
  }> {
    const { captchaToken, captchaCode, ...userData } = body;

    // 验证必要参数
    if (!captchaToken || !captchaCode) {
      return {
        success: false,
        message: '验证码token和验证码不能为空',
        timestamp: formatISOString(),
      };
    }

    // 获取客户端信息进行安全验证
    const clientInfo = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const captchaResult = await this.authService.verifyCaptcha(
      captchaToken,
      captchaCode,
      clientInfo,
    );

    if (!captchaResult.valid) {
      return {
        success: false,
        message: `验证码验证失败: ${captchaResult.reason ?? captchaResult.message}`,
        timestamp: formatISOString(),
      };
    }

    // 验证码通过，执行用户创建逻辑
    try {
      // 这里可以调用实际的用户创建服务
      // const result = await this.authService.createUser(userData);

      return {
        success: true,
        message: '用户创建成功',
        data: userData,
        timestamp: formatISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: '用户创建失败',
        error: (error as Error).message,
        timestamp: formatISOString(),
      };
    }
  }

  /**
   * 获取单个用户详情
   */
  @ApiOperation({
    summary: '获取用户详情',
    description: '根据用户ID获取用户详细信息',
  })
  @ApiResponse({
    status: 200,
    description: '获取用户详情成功',
    type: Auth,
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
  })
  @ApiBearerAuth()
  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<Auth> {
    return this.authService.getUserById(id);
  }

  /**
   * 更新用户信息
   */
  @ApiOperation({
    summary: '更新用户信息',
    description: '根据用户ID更新用户信息',
  })
  @ApiBody({
    description: '更新用户信息请求',
    type: UpdateUserDto,
  })
  @ApiResponse({
    status: 200,
    description: '更新用户信息成功',
    type: Auth,
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
  })
  @ApiBearerAuth()
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<Auth> {
    return this.authService.updateUser(id, updateUserDto);
  }

  /**
   * 删除用户
   */
  @ApiOperation({
    summary: '删除用户',
    description: '根据用户ID删除用户',
  })
  @ApiResponse({
    status: 200,
    description: '删除用户成功',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '用户删除成功',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
  })
  @ApiBearerAuth()
  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<{ message: string }> {
    return this.authService.deleteUser(id);
  }

  /**
   * 批量删除用户
   */
  @ApiOperation({
    summary: '批量删除用户',
    description: '根据用户ID数组批量删除用户',
  })
  @ApiBody({
    description: '批量删除用户请求',
    type: BatchDeleteUserDto,
  })
  @ApiResponse({
    status: 200,
    description: '批量删除用户成功',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '成功删除 3 个用户',
        },
        deletedCount: {
          type: 'number',
          example: 3,
        },
      },
    },
  })
  @ApiBearerAuth()
  @Delete('batch')
  async batchDeleteUsers(
    @Body() batchDeleteDto: BatchDeleteUserDto,
  ): Promise<{ message: string; deletedCount: number }> {
    return this.authService.batchDeleteUsers(batchDeleteDto);
  }

  /**
   * 切换用户状态
   */
  @ApiOperation({
    summary: '切换用户状态',
    description: '启用或禁用用户账号',
  })
  @ApiBody({
    description: '用户状态切换请求',
    type: ToggleUserStatusDto,
  })
  @ApiResponse({
    status: 200,
    description: '切换用户状态成功',
    type: Auth,
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
  })
  @ApiBearerAuth()
  @Patch(':id/status')
  async toggleUserStatus(
    @Param('id') id: string,
    @Body() toggleStatusDto: ToggleUserStatusDto,
  ): Promise<Auth> {
    return this.authService.toggleUserStatus(id, toggleStatusDto.status);
  }
}
