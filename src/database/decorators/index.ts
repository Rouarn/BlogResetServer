import { SetMetadata } from '@nestjs/common';

// 元数据键
export const BASE_ENTITY_KEY = 'base:entity';
export const INCLUDE_DELETED_KEY = 'base:include_deleted';
export const FORCE_DELETE_KEY = 'base:force_delete';
export const DISABLE_TIMESTAMPS_KEY = 'base:disable_timestamps';
export const SOFT_DELETE_OPERATION_KEY = 'base:soft_delete_operation';

/**
 * 包含已删除记录装饰器 - 在查询中包含软删除的记录
 * 使用此装饰器的方法将返回包括已软删除的所有记录
 */
export const IncludeDeleted = (): MethodDecorator => SetMetadata(INCLUDE_DELETED_KEY, true);

/**
 * 强制删除装饰器 - 执行物理删除而非软删除
 * 使用此装饰器的方法将永久删除记录，而不是标记为已删除
 */
export const ForceDelete = (): MethodDecorator => SetMetadata(FORCE_DELETE_KEY, true);

/**
 * 禁用时间戳装饰器 - 在特定操作中禁用自动时间戳更新
 * 使用此装饰器的方法不会自动更新 updateTime 字段
 */
export const DisableTimestamps = (): MethodDecorator => SetMetadata(DISABLE_TIMESTAMPS_KEY, true);

/**
 * 软删除操作装饰器 - 标记方法为软删除操作
 */
export const SoftDeleteOperation = (): MethodDecorator =>
  SetMetadata(SOFT_DELETE_OPERATION_KEY, true);

/**
 * 使用软删除仓库装饰器 - 标记服务使用软删除仓库
 * 这个装饰器可以用于标识哪些服务使用了软删除功能
 */
export const UseSoftDelete = (): ClassDecorator => SetMetadata('use_soft_delete', true);

/**
 * 软删除实体装饰器 - 标记实体支持软删除
 * 用于标识哪些实体支持软删除功能
 */
export const SoftDeleteEntity = (): ClassDecorator => SetMetadata('soft_delete_entity', true);

/**
 * 排除软删除装饰器 - 在特定方法中排除软删除过滤
 * 使用此装饰器的方法将返回包括已软删除的所有记录
 */
export const ExcludeSoftDelete = (): MethodDecorator => SetMetadata('exclude_soft_delete', true);
