import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  IsNull,
  Not,
  Repository,
} from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { IBaseEntity, IBaseService } from '../interfaces';
import { SoftDeleteOptions } from '../types';

// 扩展查找选项类型以支持时间戳实体
type BaseFindManyOptions<T extends IBaseEntity> = FindManyOptions<T> & {
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
};

type BaseFindOneOptions<T extends IBaseEntity> = FindOneOptions<T> & {
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
};

/**
 * 基础服务类
 * 提供完整的 CRUD 操作和软删除功能
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
    entity.deleteTime = null;

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
      entity.deleteTime = null;
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
   * 查找所有（自动过滤已删除）
   */
  async findAll(options: BaseFindManyOptions<T> & SoftDeleteOptions = {}): Promise<T[]> {
    const { includeDeleted, ...findOptions } = options;

    if (!includeDeleted) {
      findOptions.where = {
        ...findOptions.where,
        deleteTime: IsNull(),
      } as FindOptionsWhere<T>;
    }

    return await this.repository.find(findOptions);
  }

  /**
   * 根据ID查找（自动过滤已删除）
   */
  async findById(
    id: string | number,
    options: BaseFindOneOptions<T> & SoftDeleteOptions = {},
  ): Promise<T | null> {
    const { includeDeleted, ...findOptions } = options;

    if (!includeDeleted) {
      findOptions.where = {
        ...findOptions.where,
        id,
        deleteTime: IsNull(),
      } as FindOptionsWhere<T>;
    } else {
      findOptions.where = {
        ...findOptions.where,
        id,
      } as FindOptionsWhere<T>;
    }

    return await this.repository.findOne(findOptions);
  }

  /**
   * 查找一个（自动过滤已删除）
   */
  async findOne(options: BaseFindOneOptions<T> & SoftDeleteOptions = {}): Promise<T | null> {
    const { includeDeleted, ...findOptions } = options;

    if (!includeDeleted) {
      findOptions.where = {
        ...findOptions.where,
        deleteTime: IsNull(),
      } as FindOptionsWhere<T>;
    }

    return await this.repository.findOne(findOptions);
  }

  /**
   * 统计数量（自动过滤已删除）
   */
  async count(options: BaseFindManyOptions<T> & SoftDeleteOptions = {}): Promise<number> {
    const { includeDeleted, ...findOptions } = options;

    if (!includeDeleted) {
      findOptions.where = {
        ...findOptions.where,
        deleteTime: IsNull(),
      } as FindOptionsWhere<T>;
    }

    return await this.repository.count(findOptions);
  }

  /**
   * 软删除实体
   */
  async softDelete(id: string | number): Promise<void> {
    const entity = await this.findById(id, { includeDeleted: true });
    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }

    if (entity.deleteTime) {
      throw new Error(`Entity with id ${id} is already deleted`);
    }

    const now = new Date();
    entity.deleteTime = now;
    entity.updateTime = now;

    await this.repository.save(entity);
  }

  /**
   * 批量软删除
   */
  async softDeleteMany(ids: (string | number)[]): Promise<void> {
    const entities = await this.repository.find({
      where: {
        id: ids as unknown,
        deleteTime: IsNull(),
      } as FindOptionsWhere<T>,
    });

    if (entities.length === 0) {
      return;
    }

    const now = new Date();
    entities.forEach((entity) => {
      entity.deleteTime = now;
      entity.updateTime = now;
    });

    await this.repository.save(entities);
  }

  /**
   * 恢复软删除的实体
   */
  async restore(id: string | number): Promise<void> {
    const entity = await this.repository.findOne({
      where: {
        id,
        deleteTime: Not(IsNull()),
      } as unknown as FindOptionsWhere<T>,
    });

    if (!entity) {
      throw new NotFoundException(`Deleted entity with id ${id} not found`);
    }

    entity.deleteTime = null;
    entity.updateTime = new Date();

    await this.repository.save(entity);
  }

  /**
   * 批量恢复
   */
  async restoreMany(ids: (string | number)[]): Promise<void> {
    const entities = await this.repository.find({
      where: {
        id: ids as unknown,
        deleteTime: Not(IsNull()),
      } as FindOptionsWhere<T>,
    });

    if (entities.length === 0) {
      return;
    }

    const now = new Date();
    entities.forEach((entity) => {
      entity.deleteTime = null;
      entity.updateTime = now;
    });

    await this.repository.save(entities);
  }

  /**
   * 查找包含已删除的数据
   */
  async findWithDeleted(options: BaseFindManyOptions<T> = {}): Promise<T[]> {
    return await this.repository.find(options);
  }

  /**
   * 查找单个包含已删除的数据
   */
  async findOneWithDeleted(options: BaseFindOneOptions<T> = {}): Promise<T | null> {
    return await this.repository.findOne(options);
  }

  /**
   * 只查找已删除的数据
   */
  async findDeleted(options: BaseFindManyOptions<T> = {}): Promise<T[]> {
    const findOptions = {
      ...options,
      where: {
        ...options.where,
        deleteTime: Not(IsNull()),
      } as FindOptionsWhere<T>,
    };

    return await this.repository.find(findOptions);
  }

  /**
   * 强制物理删除
   */
  async forceDelete(id: string | number): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
  }

  /**
   * 批量强制物理删除
   */
  async forceDeleteMany(ids: (string | number)[]): Promise<void> {
    if (ids.length === 0) return;
    await this.repository.createQueryBuilder().delete().whereInIds(ids).execute();
  }

  /**
   * 删除实体（默认软删除，除非明确指定强制删除）
   */
  async delete(id: string | number, options: { force?: boolean } = {}): Promise<void> {
    if (options.force) {
      await this.forceDelete(id);
    } else {
      await this.softDelete(id);
    }
  }

  /**
   * 批量删除（默认软删除）
   */
  async deleteMany(ids: (string | number)[], options: { force?: boolean } = {}): Promise<void> {
    if (options.force) {
      await this.forceDeleteMany(ids);
    } else {
      await this.softDeleteMany(ids);
    }
  }
}
