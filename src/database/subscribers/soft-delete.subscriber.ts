import { EntitySubscriberInterface, EventSubscriber, SelectQueryBuilder } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BASE_ENTITY_KEY } from '../decorators';
import { BaseEntity } from '../entities/base.entity';
import { IBaseEntity } from '../interfaces';

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
export class SoftDeleteSubscriber implements EntitySubscriberInterface<IBaseEntity> {
  constructor(private readonly reflector: Reflector) {}

  /**
   * 监听所有实体
   */
  listenTo(): typeof BaseEntity {
    return BaseEntity;
  }

  // 注意：TypeORM 的 EntitySubscriberInterface 不包含 beforeQuery 方法
  // 软删除过滤应该通过其他方式实现，如全局作用域或查询构建器

  /**
   * 检查是否应该应用软删除过滤
   */
  private shouldApplySoftDeleteFilter(queryBuilder: SelectQueryBuilder<IBaseEntity>): boolean {
    // 检查查询的实体是否为时间戳管理实体
    const entity = queryBuilder.expressionMap.mainAlias?.metadata?.target;

    if (!entity) {
      return false;
    }

    // 检查是否为时间戳管理实体
    const isBaseEntity = this.isBaseEntity(
      entity as string | (new (...args: unknown[]) => unknown) | EntityClass,
    );
    if (!isBaseEntity) {
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
   * 检查实体是否为基础实体
   */
  private isBaseEntity(
    entityClass: string | (new (...args: unknown[]) => unknown) | EntityClass,
  ): boolean {
    if (!entityClass || typeof entityClass === 'string') return false;

    const entityConstructor = entityClass as EntityClass;

    // 检查是否有基础实体装饰器元数据
    const metadata = this.reflector.get(BASE_ENTITY_KEY, entityConstructor);
    if (metadata) {
      return true;
    }

    // 检查是否继承自 BaseEntity
    let currentClass = entityConstructor;
    while (currentClass) {
      if (currentClass === BaseEntity) {
        return true;
      }
      currentClass = Object.getPrototypeOf(currentClass);
    }

    return false;
  }
}
