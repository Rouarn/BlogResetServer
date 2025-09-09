/**
 * 异常类模块导出
 *
 * 统一导出所有自定义异常类，用于应用程序中的错误处理。
 * 提供了完整的异常处理体系，包括业务异常、系统异常等各种类型。
 *
 * 异常类层次结构：
 * - AppException: 应用程序异常基类
 *   - BusinessException: 业务逻辑异常
 *   - SystemException: 系统级异常
 *   - ExternalServiceException: 外部服务异常
 *   - ConfigurationException: 配置异常
 *   - DatabaseException: 数据库异常
 *   - FileOperationException: 文件操作异常
 *   - NetworkException: 网络异常
 *
 * 工厂类：
 * - BusinessExceptionFactory: 业务异常便捷创建
 * - ExceptionFactory: 通用异常便捷创建
 *
 * 枚举：
 * - LogLevel: 日志级别枚举
 *
 * 用法示例：
 * ```typescript
 * import {
 *   BusinessException,
 *   BusinessExceptionFactory,
 *   SystemException,
 *   ExceptionFactory,
 *   LogLevel
 * } from '@/common/exceptions';
 *
 * // 业务异常
 * throw new BusinessException('操作失败');
 * throw BusinessExceptionFactory.notFound('用户');
 * throw BusinessExceptionFactory.validation('邮箱格式不正确');
 *
 * // 系统异常
 * throw new SystemException('数据库连接失败');
 * throw ExceptionFactory.database('SELECT', '查询超时');
 *
 * // 外部服务异常
 * throw ExceptionFactory.externalService('PaymentAPI', '支付接口调用失败', 500);
 *
 * // 高级用法
 * throw new BusinessException(
 *   '系统维护中',
 *   HttpStatus.SERVICE_UNAVAILABLE,
 *   { maintenanceId: 'MAINT-001' },
 *   LogLevel.WARNING
 * );
 * ```
 */

// 业务异常相关
export * from './business.exception';

// 通用异常相关
export * from './common.exception';
