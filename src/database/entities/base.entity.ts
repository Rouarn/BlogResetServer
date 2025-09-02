import { Transform } from 'class-transformer';
import { BeforeInsert, BeforeUpdate, Column } from 'typeorm';
import type { IBaseEntity } from '../interfaces';

/**
 * 时间戳管理基础实体类
 * 提供自动的创建时间和更新时间管理功能
 */
export abstract class BaseEntity implements IBaseEntity {
  /**
   * 创建时间
   */
  @Transform(({ value }: { value: Date | string | null }) =>
    value instanceof Date ? value.toISOString() : value,
  )
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
  @Transform(({ value }: { value: Date | string | null }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  @Column({
    name: 'update_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    comment: '更新时间',
  })
  updateTime: Date;

  /**
   * 插入前钩子 - 设置创建时间和更新时间
   */
  @BeforeInsert()
  setCreateTimestamp(): void {
    const now = new Date();
    this.createTime = now;
    this.updateTime = now;
  }

  /**
   * 更新前钩子 - 更新时间戳
   */
  @BeforeUpdate()
  setUpdateTimestamp(): void {
    this.updateTime = new Date();
  }
}
