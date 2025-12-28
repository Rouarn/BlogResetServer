import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 数据库基础实体类
 *
 * 所有实体类应继承此类，自动包含创建时间和更新时间字段。
 * 字段名会自动根据配置进行映射 (如 vk_create_time)。
 */
export abstract class BaseEntity {
  /**
   * 创建时间
   * 数据库列名由 NamingStrategy 根据配置自动生成
   */
  @CreateDateColumn({
    comment: '创建时间',
  })
  createdAt: Date;

  /**
   * 更新时间
   * 数据库列名由 NamingStrategy 根据配置自动生成
   */
  @UpdateDateColumn({
    comment: '更新时间',
  })
  updatedAt: Date;
}
