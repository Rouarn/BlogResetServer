export { SoftDeleteRepository } from './soft-delete.repository';

import type { DataSource, EntityTarget } from 'typeorm';
import type { IBaseEntity } from '../interfaces';
import { SoftDeleteRepository } from './soft-delete.repository';

/**
 * 创建软删除仓库的工厂函数
 * @param entity 实体类
 * @param dataSource 数据源
 * @returns 软删除仓库实例
 */
export function createSoftDeleteRepository<T extends IBaseEntity>(
  entity: EntityTarget<T>,
  dataSource: DataSource,
): SoftDeleteRepository<T> {
  return new SoftDeleteRepository(entity, dataSource);
}
