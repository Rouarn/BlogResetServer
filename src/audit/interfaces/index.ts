import type { DeepPartial, FindManyOptions, FindOneOptions } from 'typeorm';
import type { SoftDeleteOptions } from '../types';

/**
 * 可时间戳管理的实体接口
 */
export interface ITimestampedEntity {
  createTime: Date;
  updateTime: Date;
  deleteTime?: Date | null;
}

/**
 * 软删除服务接口
 */
export interface ISoftDeletableService<T extends ITimestampedEntity> {
  /**
   * 软删除实体
   */
  softDelete(id: string | number): Promise<void>;

  /**
   * 批量软删除
   */
  softDeleteMany(ids: (string | number)[]): Promise<void>;

  /**
   * 恢复软删除的实体
   */
  restore(id: string | number): Promise<void>;

  /**
   * 批量恢复
   */
  restoreMany(ids: (string | number)[]): Promise<void>;

  /**
   * 查找包含已删除的数据
   */
  findWithDeleted(options?: FindManyOptions<T>): Promise<T[]>;

  /**
   * 查找单个包含已删除的数据
   */
  findOneWithDeleted(options?: FindOneOptions<T>): Promise<T | null>;

  /**
   * 只查找已删除的数据
   */
  findDeleted(options?: FindManyOptions<T>): Promise<T[]>;

  /**
   * 强制物理删除
   */
  forceDelete(id: string | number): Promise<void>;

  /**
   * 批量强制物理删除
   */
  forceDeleteMany(ids: (string | number)[]): Promise<void>;
}

/**
 * 时间戳管理服务接口
 */
export interface ITimestampedService<T extends ITimestampedEntity>
  extends ISoftDeletableService<T> {
  /**
   * 创建实体（自动设置时间戳）
   */
  create(entityData: DeepPartial<T>): Promise<T>;

  /**
   * 更新实体（自动更新时间戳）
   */
  update(id: string | number, entityData: DeepPartial<T>): Promise<T>;

  /**
   * 批量创建
   */
  createMany(entitiesData: DeepPartial<T>[]): Promise<T[]>;

  /**
   * 查找所有（自动过滤已删除）
   */
  findAll(options?: FindManyOptions<T> & SoftDeleteOptions): Promise<T[]>;

  /**
   * 根据ID查找（自动过滤已删除）
   */
  findById(id: string | number, options?: FindOneOptions<T> & SoftDeleteOptions): Promise<T | null>;

  /**
   * 查找一个（自动过滤已删除）
   */
  findOne(options?: FindOneOptions<T> & SoftDeleteOptions): Promise<T | null>;

  /**
   * 统计数量（自动过滤已删除）
   */
  count(options?: FindManyOptions<T> & SoftDeleteOptions): Promise<number>;
}
