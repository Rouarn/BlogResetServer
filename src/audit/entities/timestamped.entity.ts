import { BeforeInsert, BeforeUpdate, Column } from 'typeorm';
import { Timestamped } from '../decorators';
import { ITimestampedEntity } from '../interfaces';

/**
 * 时间戳管理基础实体类
 * 提供自动的创建时间、更新时间和软删除功能
 */
@Timestamped()
export abstract class TimestampedEntity implements ITimestampedEntity {
  /**
   * 创建时间
   */
  @Column({
    name: 'create_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '创建时间',
  })
  createTime: Date;

  /**
   * 更新时间
   */
  @Column({
    name: 'update_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    comment: '更新时间',
  })
  updateTime: Date;

  /**
   * 删除时间（软删除）
   */
  @Column({
    name: 'delete_time',
    type: 'timestamp',
    nullable: true,
    default: null,
    comment: '删除时间，用于逻辑删除',
  })
  deleteTime?: Date | null;

  /**
   * 插入前钩子 - 设置创建时间和更新时间
   */
  @BeforeInsert()
  setCreateTimestamp(): void {
    const now = new Date();
    this.createTime = now;
    this.updateTime = now;
    this.deleteTime = null;
  }

  /**
   * 更新前钩子 - 更新时间戳
   */
  @BeforeUpdate()
  setUpdateTimestamp(): void {
    this.updateTime = new Date();
  }

  /**
   * 软删除方法
   */
  softDelete(): void {
    this.deleteTime = new Date();
    this.updateTime = new Date();
  }

  /**
   * 恢复软删除
   */
  restore(): void {
    this.deleteTime = null;
    this.updateTime = new Date();
  }

  /**
   * 检查是否已被软删除
   */
  get isDeleted(): boolean {
    return this.deleteTime !== null && this.deleteTime !== undefined;
  }

  /**
   * 检查是否为活跃状态（未删除）
   */
  get isActive(): boolean {
    return !this.isDeleted;
  }
}
