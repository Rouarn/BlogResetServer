import { Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type {
  EntitySubscriberInterface,
  InsertEvent,
  LoadEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { EventSubscriber } from 'typeorm';
import { DISABLE_TIMESTAMPS_KEY, BaseEntity } from '@/database';

// 类型定义
interface EntityWithTimestamps {
  createTime?: Date | null;
  updateTime?: Date | null;
  constructor: new (...args: unknown[]) => unknown;
}

// 扩展类型以兼容 BaseEntity
type BaseEntityLike = Omit<EntityWithTimestamps, 'constructor'> & {
  constructor?: new (...args: unknown[]) => unknown;
} & Partial<BaseEntity>;

type AuditEvent = InsertEvent<BaseEntity> | UpdateEvent<BaseEntity>;

/**
 * 审计订阅者
 *
 * 自动处理实体的创建时间和更新时间，确保数据审计信息的准确性。
 * 同时记录实体删除操作，便于追踪数据变更历史。
 */
@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface<BaseEntity> {
  private readonly logger = new Logger(AuditSubscriber.name);

  constructor(private readonly reflector: Reflector) {}

  /**
   * 指定监听的实体类型
   * @returns 监听的实体基类
   */
  listenTo(): typeof BaseEntity {
    return BaseEntity;
  }

  /**
   * 实体插入前处理
   * 自动设置创建时间和更新时间
   * @param event 插入事件对象
   */
  beforeInsert(event: InsertEvent<BaseEntity>): void {
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
  }

  /**
   * 实体更新前处理
   * 自动更新时间戳
   * @param event 更新事件对象
   */
  beforeUpdate(event: UpdateEvent<BaseEntity>): void {
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
   * 实体删除前处理
   * 记录删除操作日志
   * @param event 删除事件对象
   */
  async beforeRemove(event: RemoveEvent<BaseEntity>): Promise<void> {
    if (!this.isBaseEntity(event.entity as BaseEntityLike)) {
      return;
    }

    const entity = event.entity;
    if (entity) {
      // 记录实体删除操作
      this.logger.debug(`🗑️ 实体删除: ${entity.constructor.name}`, {
        id: (entity as unknown as Record<string, unknown>).id,
      });
    }
  }

  /**
   * 实体加载后处理
   * 可在此添加加载后的处理逻辑，如时间戳格式化等
   * @param entity 加载的实体
   * @param event 加载事件对象
   */
  afterLoad(_entity: BaseEntity, _event?: LoadEvent<BaseEntity>): void {
    // 可以在这里添加加载后的处理逻辑
    // 例如：格式化时间戳、添加虚拟字段等
  }

  /**
   * 检查实体是否为时间戳管理实体
   * @param entity 待检查的实体
   * @returns 是否为时间戳管理实体
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
   * @param event 审计事件对象
   * @returns 是否禁用时间戳
   */
  private isTimestampsDisabled(event: AuditEvent): boolean {
    // 检查实体类上的元数据
    if (!event.entity) return false;

    const entityMetadata = this.reflector.get(DISABLE_TIMESTAMPS_KEY, event.entity.constructor);

    return !!entityMetadata;
  }
}
