import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 数据库基础实体抽象类
 *
 * @description
 * 所有业务实体类都应继承此类。它提供了基础的审计字段（创建时间和更新时间）。
 * 具体的数据库列名会根据 {@link CustomNamingStrategy} 和配置自动生成（例如自动转换为蛇形命名）。
 *
 * @abstract
 * @class BaseEntity
 */
export abstract class BaseEntity {
  /**
   * 创建时间
   *
   * @description
   * 记录数据行首次插入数据库的时间。
   * TypeORM 会在插入时自动设置此值。
   * 数据库列名由 NamingStrategy 根据配置自动生成。
   */
  @CreateDateColumn({
    comment: '创建时间',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  /**
   * 更新时间
   *
   * @description
   * 记录数据行最后一次更新的时间。
   * TypeORM 会在每次更新时自动刷新此值。
   * 数据库列名由 NamingStrategy 根据配置自动生成。
   */
  @UpdateDateColumn({
    comment: '更新时间',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;
}
