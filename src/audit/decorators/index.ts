import { SetMetadata, applyDecorators } from '@nestjs/common';

// 元数据键
export const TIMESTAMPED_ENTITY_KEY = 'timestamped:entity';
export const INCLUDE_DELETED_KEY = 'timestamped:include_deleted';
export const FORCE_DELETE_KEY = 'timestamped:force_delete';
export const DISABLE_TIMESTAMPS_KEY = 'timestamped:disable_timestamps';
export const SOFT_DELETE_OPERATION_KEY = 'timestamped:soft_delete_operation';

/**
 * 标记实体为可时间戳管理的实体
 * @param options 配置选项
 */
export function Timestamped(
  options: {
    /** 是否启用软删除 */
    enableSoftDelete?: boolean;
    /** 自定义字段名 */
    fieldNames?: {
      createTime?: string;
      updateTime?: string;
      deleteTime?: string;
    };
  } = {},
): ClassDecorator {
  return applyDecorators(
    SetMetadata(TIMESTAMPED_ENTITY_KEY, {
      enableSoftDelete: options.enableSoftDelete ?? true,
      fieldNames: {
        createTime: options.fieldNames?.createTime ?? 'createTime',
        updateTime: options.fieldNames?.updateTime ?? 'updateTime',
        deleteTime: options.fieldNames?.deleteTime ?? 'deleteTime',
      },
    }),
  );
}

/**
 * 在查询中包含已删除的数据
 * 用于控制器方法或服务方法
 */
export const IncludeDeleted = (): MethodDecorator => SetMetadata(INCLUDE_DELETED_KEY, true);

/**
 * 强制物理删除而不是软删除
 * 用于控制器方法或服务方法
 */
export const ForceDelete = (): MethodDecorator => SetMetadata(FORCE_DELETE_KEY, true);

/**
 * 禁用自动时间戳管理
 * 用于控制器方法或服务方法
 */
export const DisableTimestamps = (): MethodDecorator => SetMetadata(DISABLE_TIMESTAMPS_KEY, true);

/**
 * 标记操作为软删除操作
 * 内部使用
 */
export const SoftDeleteOperation = (): MethodDecorator =>
  SetMetadata(SOFT_DELETE_OPERATION_KEY, true);
