import { HttpException } from '@nestjs/common';

/**
 * 业务异常（BusinessException）
 *
 * 用于在业务逻辑中主动抛出自定义的 HTTP 异常。
 *
 * 特点：
 * - 继承自 NestJS 的 HttpException。
 * - 支持自定义错误信息和错误码，默认错误码为 400。
 * - 返回的响应体包含 code 和 message 字段，便于前端统一处理。
 *
 * 用法示例：
 * throw new BusinessException('操作失败', 422);
 */
export class BusinessException extends HttpException {
  public readonly context?: Record<string, unknown>;
  public readonly logLevel?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

  /**
   * 构造函数
   * @param message 错误信息
   * @param code HTTP 状态码，默认 400
   * @param context 额外的上下文信息
   * @param logLevel 指定日志级别
   */
  constructor(
    message: string,
    code: number = 400,
    context?: Record<string, unknown>,
    logLevel?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL',
  ) {
    super({ code, message }, code);
    this.context = context;
    this.logLevel = logLevel;
  }
}
