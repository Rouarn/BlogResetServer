import { Injectable } from '@nestjs/common';
import type {
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectId,
  RemoveOptions,
  SaveOptions,
  UpdateResult,
} from 'typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import type { IBaseEntity } from '../interfaces';

/**
 * 软删除仓库类
 * 自动处理软删除操作，重写 remove 和 delete 方法
 */
@Injectable()
export class SoftDeleteRepository<T extends IBaseEntity> extends Repository<T> {
  constructor(target: EntityTarget<T>, dataSource: DataSource) {
    super(target, dataSource.createEntityManager());
  }

  /**
   * 重写 remove 方法，实现软删除（单个实体）
   */
  async remove(entity: T, options?: RemoveOptions & { force?: boolean }): Promise<T>;
  /**
   * 重写 remove 方法，实现软删除（实体数组）
   */
  async remove(entities: T[], options?: RemoveOptions & { force?: boolean }): Promise<T[]>;
  /**
   * 重写 remove 方法，实现软删除
   */
  async remove(entities: T | T[], options?: RemoveOptions & { force?: boolean }): Promise<T | T[]> {
    const { force, ...removeOptions } = options ?? {};

    if (force) {
      // 强制物理删除
      if (Array.isArray(entities)) {
        return await super.remove(entities, removeOptions);
      } else {
        return await super.remove(entities, removeOptions);
      }
    }

    // 执行软删除
    const now = new Date();
    const entityArray = Array.isArray(entities) ? entities : [entities];
    const softDeletedEntities = entityArray.map((entity: IBaseEntity) => {
      entity.deleteTime = entity.deleteTime ?? now;
      entity.updateTime = now;
      return entity;
    });

    // 保存更新后的实体
    const updates = await this.save(softDeletedEntities as T[], removeOptions as SaveOptions);
    return Array.isArray(entities) ? updates : updates[0];
  }

  /**
   * 重写 delete 方法，自动转换为软删除
   * @param criteria 删除条件
   * @param options 删除选项
   * @returns 删除结果
   */
  async delete(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[]
      | FindOptionsWhere<T>,
    options?: { force?: boolean },
  ): Promise<{ affected?: number; raw: unknown }> {
    const { force = false } = options ?? {};

    if (force) {
      // 强制物理删除
      const result = await super.delete(criteria);
      return {
        affected: result.affected ?? undefined,
        raw: result.raw,
      };
    }

    // 执行软删除
    const now = new Date();
    const updateResult = await this.update(criteria, {
      deleteTime: now,
      updateTime: now,
    } as unknown as QueryDeepPartialEntity<T>);

    return {
      affected: updateResult.affected,
      raw: updateResult.raw,
    };
  }

  /**
   * 软删除单个实体
   * @param id 实体ID
   * @returns 更新结果
   */
  async softDelete(id: string | number): Promise<UpdateResult> {
    const now = new Date();
    return await this.update(
      id as unknown as FindOptionsWhere<T>,
      {
        deleteTime: now,
        updateTime: now,
      } as unknown as QueryDeepPartialEntity<T>,
    );
  }

  /**
   * 批量软删除
   * @param ids 实体ID数组
   * @returns 软删除结果
   */
  async softDeleteMany(ids: (string | number)[]): Promise<UpdateResult> {
    const now = new Date();
    return await this.createQueryBuilder()
      .update()
      .set({
        deleteTime: now,
        updateTime: now,
      } as unknown as QueryDeepPartialEntity<T>)
      .whereInIds(ids)
      .execute();
  }

  /**
   * 恢复单个软删除的实体
   * @param id 实体ID
   * @returns 更新结果
   */
  async restoreEntity(id: string | number): Promise<UpdateResult> {
    return await this.update(
      id as unknown as FindOptionsWhere<T>,
      {
        deleteTime: null,
        updateTime: new Date(),
      } as unknown as QueryDeepPartialEntity<T>,
    );
  }

  /**
   * 批量恢复软删除的实体
   * @param ids 实体ID数组
   * @returns 更新结果
   */
  async restoreMany(ids: (string | number)[]): Promise<UpdateResult> {
    return await this.createQueryBuilder()
      .update()
      .set({
        deleteTime: null,
        updateTime: new Date(),
      } as unknown as QueryDeepPartialEntity<T>)
      .whereInIds(ids)
      .execute();
  }

  /**
   * 强制物理删除
   * @param entities 要删除的实体或实体数组
   * @param options 删除选项
   * @returns 删除后的实体
   */
  async forceRemove(entities: T | T[], options?: RemoveOptions): Promise<T | T[]> {
    if (Array.isArray(entities)) {
      return await super.remove(entities, options);
    } else {
      return await super.remove(entities, options);
    }
  }

  /**
   * 强制物理删除（通过条件）
   * @param criteria 删除条件
   * @returns 删除结果
   */
  async forceDelete(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[]
      | FindOptionsWhere<T>,
  ): Promise<{ affected?: number; raw: unknown }> {
    const result = await super.delete(criteria);
    return {
      affected: result.affected ?? undefined,
      raw: result.raw,
    };
  }

  /**
   * 查找所有未删除的实体
   * @param options 查找选项
   * @returns 实体数组
   */
  async findActive(options?: FindManyOptions<T>): Promise<T[]> {
    return await this.find({
      ...options,
      where: {
        ...options?.where,
        deleteTime: null,
      } as FindOptionsWhere<T>,
    });
  }

  /**
   * 查找单个未删除的实体
   * @param options 查找选项
   * @returns 实体或null
   */
  async findOneActive(options?: FindOneOptions<T>): Promise<T | null> {
    return await this.findOne({
      ...options,
      where: {
        ...options?.where,
        deleteTime: null,
      } as FindOptionsWhere<T>,
    });
  }

  /**
   * 查找所有已删除的实体
   * @param options 查找选项
   * @returns 实体数组
   */
  async findDeleted(options?: FindManyOptions<T>): Promise<T[]> {
    return await this.find({
      ...options,
      where: {
        ...options?.where,
        deleteTime: Not(IsNull()),
      } as FindOptionsWhere<T>,
    });
  }

  /**
   * 统计未删除的实体数量
   * @param options 查找选项
   * @returns 数量
   */
  async countActive(options?: FindManyOptions<T>): Promise<number> {
    return await this.count({
      ...options,
      where: {
        ...options?.where,
        deleteTime: null,
      } as FindOptionsWhere<T>,
    });
  }

  /**
   * 统计已删除的实体数量
   * @param options 查找选项
   * @returns 数量
   */
  async countDeleted(options?: FindManyOptions<T>): Promise<number> {
    return await this.count({
      ...options,
      where: {
        ...options?.where,
        deleteTime: Not(IsNull()),
      } as FindOptionsWhere<T>,
    });
  }
}
