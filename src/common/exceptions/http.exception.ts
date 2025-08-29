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
  /**
   * 构造函数
   * @param message 错误信息
   * @param code HTTP 状态码，默认 400
   */
  constructor(message: string, code: number = 400) {
    super({ code, message }, code);
  }
}
