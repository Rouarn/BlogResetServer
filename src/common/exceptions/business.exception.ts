import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * 业务异常基类（BusinessException）
 *
 * 用于在业务逻辑中主动抛出自定义的 HTTP 异常。
 * 提供统一的异常处理机制，支持结构化的错误信息和上下文数据。
 *
 * 特点：
 * - 继承自 NestJS 的 HttpException，完全兼容 NestJS 异常处理机制
 * - 支持自定义错误信息和 HTTP 状态码，默认状态码为 400 (Bad Request)
 * - 提供结构化的响应体格式，包含 code 和 message 字段
 * - 支持附加上下文信息，便于调试和日志记录
 * - 支持指定日志级别，便于日志系统分级处理
 * - 提供错误分类标识，便于前端统一处理不同类型的业务错误
 *
 * 响应格式：
 * {
 *   "code": 400,
 *   "message": "操作失败",
 *   "timestamp": "2024-01-01T00:00:00.000Z",
 *   "path": "/api/example"
 * }
 *
 * 用法示例：
 * ```typescript
 * // 基础用法
 * throw new BusinessException('用户不存在');
 *
 * // 指定状态码
 * throw new BusinessException('数据验证失败', HttpStatus.UNPROCESSABLE_ENTITY);
 *
 * // 附加上下文信息
 * throw new BusinessException('操作失败', HttpStatus.BAD_REQUEST, {
 *   userId: '12345',
 *   operation: 'updateProfile',
 *   timestamp: Date.now()
 * });
 *
 * // 指定日志级别
 * throw new BusinessException(
 *   '系统维护中',
 *   HttpStatus.SERVICE_UNAVAILABLE,
 *   { maintenanceId: 'MAINT-001' },
 *   LogLevel.WARNING
 * );
 * ```
 */
export class BusinessException extends HttpException {
  /** 异常上下文信息，用于调试和日志记录 */
  public readonly context?: Record<string, unknown>;

  /** 日志级别，用于日志系统分级处理 */
  public readonly logLevel: LogLevel;

  /** 异常分类标识，便于前端处理 */
  public readonly category: string;

  /** 异常发生时间戳 */
  public readonly timestamp: number;

  /**
   * 构造函数
   * @param message 错误信息，应该是用户友好的描述
   * @param status HTTP 状态码，默认 400 (Bad Request)
   * @param context 额外的上下文信息，用于调试和日志记录
   * @param logLevel 指定日志级别，默认 ERROR
   * @param category 异常分类标识，默认 'BUSINESS_ERROR'
   */
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    context?: Record<string, unknown>,
    logLevel: LogLevel = LogLevel.ERROR,
    category: string = 'BUSINESS_ERROR',
  ) {
    // 构造符合 NestJS 异常过滤器期望的响应格式
    super(
      {
        code: status,
        message,
        category,
        timestamp: Date.now(),
      },
      status,
    );

    this.context = context;
    this.logLevel = logLevel;
    this.category = category;
    this.timestamp = Date.now();
  }

  /**
   * 获取格式化的错误信息，包含所有相关数据
   * @returns 格式化的错误对象
   */
  public getFormattedError(): {
    message: string;
    status: number;
    category: string;
    context?: Record<string, unknown>;
    logLevel: LogLevel;
    timestamp: number;
  } {
    return {
      message: this.message,
      status: this.getStatus(),
      category: this.category,
      context: this.context,
      logLevel: this.logLevel,
      timestamp: this.timestamp,
    };
  }

  /**
   * 检查是否为指定的日志级别或更高级别
   * @param level 要检查的日志级别
   * @returns 是否满足级别要求
   */
  public isLogLevel(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARNING,
      LogLevel.ERROR,
      LogLevel.CRITICAL,
    ];
    const currentIndex = levels.indexOf(this.logLevel);
    const targetIndex = levels.indexOf(level);
    return currentIndex >= targetIndex;
  }
}

/**
 * 常用业务异常的便捷创建函数
 */
export class BusinessExceptionFactory {
  /**
   * 创建验证失败异常
   * @param message 错误信息
   * @param context 上下文信息
   */
  static validation(message: string, context?: Record<string, unknown>): BusinessException {
    return new BusinessException(
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      context,
      LogLevel.WARNING,
      'VALIDATION_ERROR',
    );
  }

  /**
   * 创建资源不存在异常
   * @param resource 资源名称
   * @param context 上下文信息
   */
  static notFound(resource: string, context?: Record<string, unknown>): BusinessException {
    return new BusinessException(
      `${resource}不存在`,
      HttpStatus.NOT_FOUND,
      context,
      LogLevel.INFO,
      'RESOURCE_NOT_FOUND',
    );
  }

  /**
   * 创建权限不足异常
   * @param action 操作名称
   * @param context 上下文信息
   */
  static forbidden(action: string, context?: Record<string, unknown>): BusinessException {
    return new BusinessException(
      `无权限执行操作：${action}  ${context?.reason ?? ''}`,
      HttpStatus.FORBIDDEN,
      context,
      LogLevel.WARNING,
      'PERMISSION_DENIED',
    );
  }

  /**
   * 创建资源冲突异常
   * @param message 错误信息
   * @param context 上下文信息
   */
  static conflict(message: string, context?: Record<string, unknown>): BusinessException {
    return new BusinessException(
      message,
      HttpStatus.CONFLICT,
      context,
      LogLevel.WARNING,
      'RESOURCE_CONFLICT',
    );
  }

  /**
   * 创建系统繁忙异常
   * @param context 上下文信息
   */
  static systemBusy(context?: Record<string, unknown>): BusinessException {
    return new BusinessException(
      '系统繁忙，请稍后重试',
      HttpStatus.SERVICE_UNAVAILABLE,
      context,
      LogLevel.ERROR,
      'SYSTEM_BUSY',
    );
  }

  /**
   * 创建参数错误异常
   * @param parameter 参数名称
   * @param context 上下文信息
   */
  static invalidParameter(parameter: string, context?: Record<string, unknown>): BusinessException {
    return new BusinessException(
      `参数错误：${parameter}`,
      HttpStatus.BAD_REQUEST,
      context,
      LogLevel.WARNING,
      'INVALID_PARAMETER',
    );
  }
}
