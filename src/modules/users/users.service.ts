import { Role, Status, toggleStatus } from '@/common/enums';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { CreateUserDto } from './dto/create-user.dto';
import type { BatchDeleteUserDto, UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

/**
 * 用户服务（UserService）
 *
 * 提供用户信息管理的核心业务逻辑，专注于用户资料的CRUD操作。
 * 与认证功能分离，职责单一明确。
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
   * 获取所有用户（带分页和缓存）
   * @param current 当前页码
   * @param size 每页数量
   * @returns 用户列表和总数
   */
  async findAll(current: number = 1, size: number = 10): Promise<{ list: User[]; total: number }> {
    const [data, total] = await this.userRepository.findAndCount({
      skip: (current - 1) * size,
      take: size,
      relations: ['auth'],
      order: { createTime: 'DESC' },
    });
    const result = { list: data, total };
    return result;
  }

  /**
   * 根据ID获取用户（带缓存）
   * @param id 用户ID
   * @returns 用户信息
   */
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
   * 更新用户信息
   * @param id 用户ID
   * @param updateUserDto 更新用户DTO
   * @returns 更新后的用户信息
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<void> {
    const user = await this.findById(id);

    // 检查邮箱唯一性
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw BusinessExceptionFactory.conflict('邮箱已被使用', { email: updateUserDto.email });
      }
    }

    Object.assign(user, updateUserDto);

    await this.userRepository.save(user);

    return;
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
      throw BusinessExceptionFactory.notFound('用户认证信息', { id, hasAuth: false });
    }

    // 更新认证状态
    user.auth.status = status ?? toggleStatus(user.auth.status);
    await this.userRepository.save(user);

    return user;
  }

  /**
   * 删除用户
   * @param id 用户ID
   * @returns 删除结果消息
   */
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
  async batchRemove(batchDeleteDto: BatchDeleteUserDto): Promise<{ message: string }> {
    const { ids } = batchDeleteDto;

    const users = await this.userRepository.findBy({ id: In(ids) });
    if (users.length === 0) {
      throw BusinessExceptionFactory.notFound('要删除的用户', { ids });
    }

    await this.userRepository.remove(users);

    return { message: `成功删除 ${users.length} 个用户` };
  }
}
