import { SetMetadata } from '@nestjs/common';

// 元数据键
export const BASE_ENTITY_KEY = 'base:entity';
export const DISABLE_TIMESTAMPS_KEY = 'base:disable_timestamps';

/**
 * 禁用时间戳装饰器 - 在特定操作中禁用自动时间戳更新
 * 使用此装饰器的方法不会自动更新 updateTime 字段
 */
export const DisableTimestamps = (): MethodDecorator => SetMetadata(DISABLE_TIMESTAMPS_KEY, true);
