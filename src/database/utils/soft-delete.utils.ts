import type { FindOptionsWhere } from 'typeorm';
import { IsNull, Not } from 'typeorm';
import type { IBaseEntity } from '../interfaces';

/**
 * 软删除工具类
 * 提供软删除相关的工具方法
 */
export class SoftDeleteUtils {
  /**
   * 添加软删除过滤条件（只查询未删除的记录）
   * @param where 原始查询条件
   * @returns 添加软删除过滤后的查询条件
   */
  static addSoftDeleteFilter<T extends IBaseEntity>(
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    if (Array.isArray(where)) {
      return where.map((condition) => ({
        ...condition,
        deleteTime: IsNull(),
      }));
    }

    return {
      ...where,
      deleteTime: IsNull(),
    } as FindOptionsWhere<T>;
  }

  /**
   * 添加已删除记录过滤条件（只查询已删除的记录）
   * @param where 原始查询条件
   * @returns 添加已删除过滤后的查询条件
   */
  static addDeletedFilter<T extends IBaseEntity>(
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    if (Array.isArray(where)) {
      return where.map((condition) => ({
        ...condition,
        deleteTime: Not(IsNull()),
      }));
    }

    return {
      ...where,
      deleteTime: Not(IsNull()),
    } as FindOptionsWhere<T>;
  }

  /**
   * 检查实体是否已被软删除
   * @param entity 实体对象
   * @returns 是否已被软删除
   */
  static isDeleted<T extends IBaseEntity>(entity: T): boolean {
    return entity.deleteTime !== null && entity.deleteTime !== undefined;
  }

  /**
   * 检查实体是否为活跃状态（未被删除）
   * @param entity 实体对象
   * @returns 是否为活跃状态
   */
  static isActive<T extends IBaseEntity>(entity: T): boolean {
    return !this.isDeleted(entity);
  }

  /**
   * 过滤出未删除的实体
   * @param entities 实体数组
   * @returns 未删除的实体数组
   */
  static filterActive<T extends IBaseEntity>(entities: T[]): T[] {
    return entities.filter((entity) => this.isActive(entity));
  }

  /**
   * 过滤出已删除的实体
   * @param entities 实体数组
   * @returns 已删除的实体数组
   */
  static filterDeleted<T extends IBaseEntity>(entities: T[]): T[] {
    return entities.filter((entity) => this.isDeleted(entity));
  }

  /**
   * 获取软删除统计信息
   * @param entities 实体数组
   * @returns 统计信息
   */
  static getDeleteStats<T extends IBaseEntity>(
    entities: T[],
  ): {
    total: number;
    active: number;
    deleted: number;
    activePercentage: number;
    deletedPercentage: number;
  } {
    const total = entities.length;
    const active = this.filterActive(entities).length;
    const deleted = this.filterDeleted(entities).length;

    return {
      total,
      active,
      deleted,
      activePercentage: total > 0 ? (active / total) * 100 : 0,
      deletedPercentage: total > 0 ? (deleted / total) * 100 : 0,
    };
  }

  /**
   * 创建软删除时间戳
   * @returns 当前时间戳
   */
  static createDeleteTimestamp(): Date {
    return new Date();
  }

  /**
   * 批量标记实体为已删除
   * @param entities 实体数组
   * @returns 标记后的实体数组
   */
  static markAsDeleted<T extends IBaseEntity>(entities: T[]): T[] {
    const now = this.createDeleteTimestamp();
    return entities.map((entity) => {
      if (!this.isDeleted(entity)) {
        entity.deleteTime = now;
        entity.updateTime = now;
      }
      return entity;
    });
  }

  /**
   * 批量恢复实体（移除删除标记）
   * @param entities 实体数组
   * @returns 恢复后的实体数组
   */
  static restore<T extends IBaseEntity>(entities: T[]): T[] {
    const now = new Date();
    return entities.map((entity) => {
      if (this.isDeleted(entity)) {
        entity.deleteTime = null;
        entity.updateTime = now;
      }
      return entity;
    });
  }

  /**
   * 验证软删除配置
   * @param entity 实体类或实体实例
   * @returns 是否支持软删除
   */
  static validateSoftDeleteSupport<T extends IBaseEntity>(entity: T | (new () => T)): boolean {
    const instance = typeof entity === 'function' ? new entity() : entity;
    return 'deleteTime' in instance && 'updateTime' in instance && 'createTime' in instance;
  }
}
