import { Transform } from 'class-transformer';
import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 时间戳管理基础实体类
 * 使用 TypeORM 内置装饰器自动管理创建时间和更新时间
 */
export abstract class BaseEntity {
  /**
   * 创建时间
   * 使用 @CreateDateColumn 自动设置创建时间
   */
  @Transform(({ value }: { value: Date | string | null }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  @CreateDateColumn({
    type: 'timestamp',
    comment: '创建时间',
  })
  createTime: Date;

  /**
   * 更新时间
   * 使用 @UpdateDateColumn 自动设置和更新时间
   */
  @Transform(({ value }: { value: Date | string | null }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  @UpdateDateColumn({
    type: 'timestamp',
    comment: '更新时间',
  })
  updateTime: Date;
}
