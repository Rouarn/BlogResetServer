import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import type { IBaseEntity, IBaseService } from '../interfaces';

// 扩展查找选项类型以支持时间戳实体
type BaseFindManyOptions<T extends IBaseEntity> = FindManyOptions<T> & {
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
};

type BaseFindOneOptions<T extends IBaseEntity> = FindOneOptions<T> & {
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
};

/**
 * 基础服务类
 * 提供完整的 CRUD 操作和自动时间戳管理功能
 */
@Injectable()
export abstract class BaseService<T extends IBaseEntity> implements IBaseService<T> {
  constructor(protected readonly repository: Repository<T>) {}

  /**
   * 创建实体（自动设置时间戳）
   */
  async create(entityData: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(entityData);
    const now = new Date();

    // 设置时间戳
    entity.createTime = now;
    entity.updateTime = now;

    return await this.repository.save(entity);
  }

  /**
   * 批量创建
   */
  async createMany(entitiesData: DeepPartial<T>[]): Promise<T[]> {
    const entities = entitiesData.map((data) => {
      const entity = this.repository.create(data);
      const now = new Date();
      entity.createTime = now;
      entity.updateTime = now;
      return entity;
    });

    return await this.repository.save(entities);
  }

  /**
   * 更新实体（自动更新时间戳）
   */
  async update(id: string | number, entityData: DeepPartial<T>): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }

    // 更新数据和时间戳
    Object.assign(entity, entityData);
    entity.updateTime = new Date();

    return await this.repository.save(entity);
  }

  /**
   * 查找所有实体
   */
  async findAll(options: BaseFindManyOptions<T> = {}): Promise<T[]> {
    return await this.repository.find(options);
  }

  /**
   * 根据ID查找实体
   */
  async findById(id: string | number, options: BaseFindOneOptions<T> = {}): Promise<T | null> {
    const findOptions = {
      ...options,
      where: {
        ...options.where,
        id,
      } as FindOptionsWhere<T>,
    };

    return await this.repository.findOne(findOptions);
  }

  /**
   * 查找单个实体
   */
  async findOne(options: BaseFindOneOptions<T> = {}): Promise<T | null> {
    return await this.repository.findOne(options);
  }

  /**
   * 统计数量
   */
  async count(options: BaseFindManyOptions<T> = {}): Promise<number> {
    return await this.repository.count(options);
  }

  /**
   * 删除实体（物理删除）
   */
  async delete(id: string | number): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
  }

  /**
   * 批量删除（物理删除）
   */
  async deleteMany(ids: (string | number)[]): Promise<void> {
    if (ids.length === 0) return;
    await this.repository.createQueryBuilder().delete().whereInIds(ids).execute();
  }
}
