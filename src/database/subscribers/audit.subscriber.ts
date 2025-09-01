import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type {
  EntitySubscriberInterface,
  InsertEvent,
  LoadEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { EventSubscriber } from 'typeorm';
import { DISABLE_TIMESTAMPS_KEY } from '../decorators';
import { BaseEntity } from '../entities/base.entity';
import type { IBaseEntity } from '../interfaces';

// 类型定义
interface EntityWithTimestamps {
  createTime?: Date | null;
  updateTime?: Date | null;
  deleteTime?: Date | null;
  constructor: new (...args: unknown[]) => unknown;
}

// 扩展类型以兼容 IBaseEntity
type BaseEntityLike = Omit<EntityWithTimestamps, 'constructor'> & {
  constructor?: new (...args: unknown[]) => unknown;
} & Partial<IBaseEntity>;

type AuditEvent = InsertEvent<IBaseEntity> | UpdateEvent<IBaseEntity>;

/**
 * 时间戳订阅者
 * 自动处理实体的创建时间和更新时间
 */
@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface<IBaseEntity> {
  constructor(private readonly reflector: Reflector) {}

  /**
   * 监听所有实体
   */
  listenTo(): typeof BaseEntity {
    return BaseEntity;
  }

  /**
   * 插入前处理
   */
  beforeInsert(event: InsertEvent<IBaseEntity>): void {
    if (!this.isBaseEntity(event.entity as BaseEntityLike) || this.isTimestampsDisabled(event)) {
      return;
    }

    const now = new Date();
    const entity = event.entity;

    // 设置创建时间和更新时间
    if (!entity.createTime) {
      entity.createTime = now;
    }
    if (!entity.updateTime) {
      entity.updateTime = now;
    }
    // 确保删除时间为 null
    if (entity.deleteTime === undefined) {
      entity.deleteTime = null;
    }
  }

  /**
   * 更新前处理
   */
  beforeUpdate(event: UpdateEvent<IBaseEntity>): void {
    if (!this.isBaseEntity(event.entity as BaseEntityLike) || this.isTimestampsDisabled(event)) {
      return;
    }

    const entity = event.entity;
    if (entity) {
      // 更新时间戳
      entity.updateTime = new Date();
    }
  }

  /**
   * 删除前处理 - 转换为软删除
   */
  async beforeRemove(event: RemoveEvent<IBaseEntity>): Promise<void> {
    if (!this.isBaseEntity(event.entity as BaseEntityLike) || this.isForceDelete(event)) {
      return;
    }

    const entity = event.entity;
    if (entity && !entity.deleteTime) {
      // 执行软删除
      const now = new Date();
      entity.deleteTime = now;
      entity.updateTime = now;

      // 使用 queryRunner 保存软删除状态，然后阻止物理删除
      if (event.queryRunner) {
        await event.queryRunner.manager.save(entity);
        // 通过抛出异常来阻止物理删除
        throw new Error('SOFT_DELETE_INTERCEPTED');
      } else {
        // 如果没有 queryRunner，使用 manager 保存
        await event.manager.save(entity);
        throw new Error('SOFT_DELETE_INTERCEPTED');
      }
    }
  }

  /**
   * 加载后处理 - 可以在这里添加额外的逻辑
   */
  afterLoad(_entity: IBaseEntity, _event?: LoadEvent<IBaseEntity>): void {
    // 可以在这里添加加载后的处理逻辑
    // 例如：格式化时间戳、添加虚拟字段等
  }

  /**
   * 检查实体是否为时间戳管理实体
   */
  private isBaseEntity(entity: BaseEntityLike | null | undefined): boolean {
    if (!entity) return false;

    // 检查是否继承自 BaseEntity
    if (entity instanceof BaseEntity) {
      return true;
    }

    // 检查是否有时间戳字段
    return 'createTime' in entity && 'updateTime' in entity && 'deleteTime' in entity;
  }

  /**
   * 检查是否禁用时间戳
   */
  private isTimestampsDisabled(event: AuditEvent): boolean {
    // 检查实体类上的元数据
    if (!event.entity) return false;

    const entityMetadata = this.reflector.get(DISABLE_TIMESTAMPS_KEY, event.entity.constructor);

    return !!entityMetadata;
  }

  /**
   * 检查是否为强制删除
   */
  private isForceDelete(_event: RemoveEvent<IBaseEntity>): boolean {
    // 这里可以通过上下文或其他方式检查是否为强制删除
    // 暂时返回 false，具体实现可能需要结合拦截器
    return false;
  }
}
