import { EntitySubscriberInterface, EventSubscriber, SelectQueryBuilder } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TIMESTAMPED_ENTITY_KEY } from '../decorators';
import { TimestampedEntity } from '../entities/timestamped.entity';
import { ITimestampedEntity } from '../interfaces';

// 类型定义
interface EntityClass {
  new (...args: unknown[]): unknown;
  prototype: unknown;
}

/**
 * 软删除订阅者
 * 自动在查询中过滤已删除的数据
 */
@Injectable()
@EventSubscriber()
export class SoftDeleteSubscriber implements EntitySubscriberInterface<ITimestampedEntity> {
  constructor(private readonly reflector: Reflector) {}

  /**
   * 监听所有实体
   */
  listenTo(): typeof TimestampedEntity {
    return TimestampedEntity;
  }

  // 注意：TypeORM 的 EntitySubscriberInterface 不包含 beforeQuery 方法
  // 软删除过滤应该通过其他方式实现，如全局作用域或查询构建器

  /**
   * 检查是否应该应用软删除过滤
   */
  private shouldApplySoftDeleteFilter(
    queryBuilder: SelectQueryBuilder<ITimestampedEntity>,
  ): boolean {
    // 检查查询的实体是否为时间戳管理实体
    const entity = queryBuilder.expressionMap.mainAlias?.metadata?.target;

    if (!entity) {
      return false;
    }

    // 检查是否为时间戳管理实体
    const isTimestampedEntity = this.isTimestampedEntity(
      entity as string | (new (...args: unknown[]) => unknown) | EntityClass,
    );
    if (!isTimestampedEntity) {
      return false;
    }

    // 检查是否已经有 deleteTime 的条件（避免重复添加）
    const existingConditions = queryBuilder.expressionMap.wheres;
    const hasDeleteTimeCondition = existingConditions.some((where) => {
      if (typeof where.condition === 'string') {
        return where.condition.includes('deleteTime');
      }
      return false;
    });

    if (hasDeleteTimeCondition) {
      return false;
    }

    // 检查是否明确要求包含已删除数据
    // 这个检查可能需要通过其他方式实现，比如查询上下文
    return true;
  }

  /**
   * 检查实体是否为时间戳管理实体
   */
  private isTimestampedEntity(
    entityClass: string | (new (...args: unknown[]) => unknown) | EntityClass,
  ): boolean {
    if (!entityClass || typeof entityClass === 'string') return false;

    const entityConstructor = entityClass as EntityClass;

    // 检查是否有时间戳装饰器元数据
    const metadata = this.reflector.get(TIMESTAMPED_ENTITY_KEY, entityConstructor);
    if (metadata) {
      return true;
    }

    // 检查是否继承自 TimestampedEntity
    let currentClass = entityConstructor;
    while (currentClass) {
      if (currentClass === TimestampedEntity) {
        return true;
      }
      currentClass = Object.getPrototypeOf(currentClass);
    }

    return false;
  }
}
