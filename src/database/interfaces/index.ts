import type { DeepPartial, FindManyOptions, FindOneOptions } from 'typeorm';

/**
 * 基础实体接口
 */
export interface IBaseEntity {
  createTime: Date;
  updateTime: Date;
}

/**
 * 基础服务接口
 */
export interface IBaseService<T extends IBaseEntity> {
  /**
   * 创建实体
   */
  create(entityData: DeepPartial<T>): Promise<T>;

  /**
   * 更新实体
   */
  update(id: string | number, entityData: DeepPartial<T>): Promise<T>;

  /**
   * 批量创建
   */
  createMany(entitiesData: DeepPartial<T>[]): Promise<T[]>;

  /**
   * 查找所有实体
   */
  findAll(options?: FindManyOptions<T>): Promise<T[]>;

  /**
   * 根据ID查找实体
   */
  findById(id: string | number, options?: FindOneOptions<T>): Promise<T | null>;

  /**
   * 查找单个实体
   */
  findOne(options?: FindOneOptions<T>): Promise<T | null>;

  /**
   * 统计数量
   */
  count(options?: FindManyOptions<T>): Promise<number>;

  /**
   * 删除实体
   */
  delete(id: string | number): Promise<void>;

  /**
   * 批量删除
   */
  deleteMany(ids: (string | number)[]): Promise<void>;
}
