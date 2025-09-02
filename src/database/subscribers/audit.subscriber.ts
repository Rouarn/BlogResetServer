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
   * 删除前处理 - 仅用于记录和验证
   * 注意：实际的软删除逻辑现在由 SoftDeleteRepository 处理
   */
  async beforeRemove(event: RemoveEvent<IBaseEntity>): Promise<void> {
    if (!this.isBaseEntity(event.entity as BaseEntityLike)) {
      return;
    }

    const entity = event.entity;
    if (entity) {
      // 这里可以添加删除前的日志记录或其他业务逻辑
      // 但不再阻止物理删除，因为软删除逻辑已经在 Repository 层处理
      console.log(`Entity ${entity.constructor.name} is being removed`, {
        id: (entity as unknown as Record<string, unknown>).id,
        deleteTime: entity.deleteTime,
        isAlreadyDeleted: !!entity.deleteTime,
      });
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
}
