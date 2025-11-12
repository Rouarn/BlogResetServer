import { CACHE_PREFIXES, CACHE_TOKENS, CACHE_TTL } from '@/common/constants';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { Cache, CacheEvict, ICacheService } from '@/shared/cache';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, Status, isEnabled, toggleStatus } from 'src/common/enums';
import { Repository } from 'typeorm';
import type { CreateUserDto } from './dto/create-user.dto';
import type { BatchDeleteUserDto, UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

/**
 * 用户服务（UserService）
 *
 * 提供用户信息管理的核心业务逻辑，专注于用户资料的CRUD操作。
 * 与认证功能分离，职责单一明确。
 *
 * 功能说明：
 * - 用户信息CRUD：创建、查询、更新、删除用户资料
 * - 用户状态管理：启用/禁用用户
 * - 用户角色管理：分配和管理用户角色
 * - 批量操作：批量删除、批量状态更新
 * - 缓存管理：自动缓存用户信息，提高查询性能
 *
 * 依赖项：
 * - Repository<User>: 用户数据仓库，处理数据库操作
 * - ICacheService: 缓存服务，用于用户信息缓存
 *
 * 安全特性：
 * - 数据验证和完整性检查
 * - 缓存自动失效管理
 * - 批量操作的事务支持
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_TOKENS.I_CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {}

  /**
   * 创建用户
   * @param createUserDto 创建用户DTO
   * @returns 创建的用户信息
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查是否已存在相同邮箱的用户
    if (createUserDto.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingUser) {
        throw BusinessExceptionFactory.conflict('邮箱已被使用', { email: createUserDto.email });
      }
    }

    const user = this.userRepository.create({
      authId: createUserDto.authId,
      nickname: createUserDto.nickname,
      avatar: createUserDto.avatar,
      gender: createUserDto.gender,
      mobile: createUserDto.mobile,
      roles: createUserDto.roles as Role,
      bio: createUserDto.bio,
      email: createUserDto.email,
      birthday: createUserDto.birthday,
      city: createUserDto.city,
      profession: createUserDto.profession,
    });
    return await this.userRepository.save(user);
  }

  /**
   * 获取用户信息（带缓存）
   * @param user 用户对象
   * @returns 用户基本信息
   */
  @Cache({ key: `${CACHE_PREFIXES.USER_INFO}:\${0.id}`, ttl: CACHE_TTL.USER_INFO })
  getUserInfo(user: User): {
    userId: string;
    nickname: string;
    avatar: string;
    roles: string;
  } {
    return {
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      roles: user.roles,
    };
  }

  /**
   * 根据ID获取用户（带缓存）
   * @param id 用户ID
   * @returns 用户信息
   */
  @Cache({ key: `${CACHE_PREFIXES.USER}:\${0}`, ttl: CACHE_TTL.USER_INFO })
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['auth'],
    });
    if (!user) {
      throw BusinessExceptionFactory.notFound('用户', { id });
    }
    return user;
  }

  /**
   * 根据认证ID获取用户
   * @param authId 认证ID
   * @returns 用户信息
   */
  async findByAuthId(authId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { authId },
      relations: ['auth'],
    });
  }

  /**
   * 获取所有用户（带分页和缓存）
   * @param current 当前页码
   * @param size 每页数量
   * @returns 用户列表和总数
   */
  @Cache({ key: `${CACHE_PREFIXES.USERS}:page:\${0}:size:\${1}`, ttl: CACHE_TTL.USER_LIST })
  async findAll(current: number = 1, size: number = 10): Promise<{ data: User[]; total: number }> {
    const [data, total] = await this.userRepository.findAndCount({
      skip: (current - 1) * size,
      take: size,
      relations: ['auth'],
      order: { createTime: 'DESC' },
    });
    return { data, total };
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param updateUserDto 更新用户DTO
   * @returns 更新后的用户信息
   */
  @CacheEvict({
    keys: [
      `${CACHE_PREFIXES.USER}:\${0}`,
      `${CACHE_PREFIXES.USER_INFO}:\${0}`,
      `${CACHE_PREFIXES.USERS}:*`,
    ],
  })
  async update(id: string, updateUserDto: UpdateUserDto): Promise<undefined> {
    const user = await this.findById(id);

    // 检查邮箱唯一性
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw BusinessExceptionFactory.conflict('邮箱已被使用', {
          email: updateUserDto.email,
          userId: id,
        });
      }
    }

    Object.assign(user, updateUserDto);

    await this.userRepository.save(user);

    return;
  }

  /**
   * 删除用户
   * @param id 用户ID
   * @returns 删除结果消息
   */
  @CacheEvict({
    keys: [
      `${CACHE_PREFIXES.USER}:\${0}`,
      `${CACHE_PREFIXES.USER_INFO}:\${0}`,
      `${CACHE_PREFIXES.USERS}:*`,
    ],
  })
  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
    return { message: '用户删除成功' };
  }

  /**
   * 批量删除用户
   * @param batchDeleteDto 批量删除DTO
   * @returns 删除结果
   */
  @CacheEvict({
    keys: [
      `${CACHE_PREFIXES.USER}:*`,
      `${CACHE_PREFIXES.USER_INFO}:*`,
      `${CACHE_PREFIXES.USERS}:*`,
    ],
  })
  async batchRemove(
    batchDeleteDto: BatchDeleteUserDto,
  ): Promise<{ message: string; deletedCount: number }> {
    const { ids } = batchDeleteDto;

    const users = await this.userRepository.findByIds(ids);
    if (users.length === 0) {
      throw BusinessExceptionFactory.notFound('要删除的用户', { ids });
    }

    await this.userRepository.remove(users);

    return {
      message: `成功删除 ${users.length} 个用户`,
      deletedCount: users.length,
    };
  }

  /**
   * 切换用户状态（通过关联的认证实体）
   * 注意：这个方法需要与认证服务协作
   * @param id 用户ID
   * @param status 目标状态
   * @returns 更新后的用户信息
   */
  async toggleUserStatus(id: string, status?: Status): Promise<User> {
    const user = await this.findById(id);

    if (!user.auth) {
      throw BusinessExceptionFactory.notFound('用户认证信息', { userId: id });
    }

    // 更新认证状态
    user.auth.status = status ?? toggleStatus(user.auth.status);
    await this.userRepository.save(user);

    return user;
  }

  /**
   * 启用用户
   * @param id 用户ID
   * @returns 更新后的用户信息
   */
  async enableUser(id: string): Promise<User> {
    return await this.toggleUserStatus(id, Status.ENABLED);
  }

  /**
   * 禁用用户
   * @param id 用户ID
   * @returns 更新后的用户信息
   */
  async disableUser(id: string): Promise<User> {
    return await this.toggleUserStatus(id, Status.DISABLED);
  }

  /**
   * 检查用户是否启用
   * @param id 用户ID
   * @returns 是否启用
   */
  async isUserEnabled(id: string): Promise<boolean> {
    const user = await this.findById(id);
    return user.auth ? isEnabled(user.auth.status) : false;
  }
}
