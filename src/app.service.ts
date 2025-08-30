/**
 * 应用根服务
 *
 * 功能说明:
 * - 提供应用级别的基础服务
 * - 处理通用的业务逻辑
 *
 * 特点:
 * - 单例服务，全局可用
 * - 轻量级实现
 * - 可扩展的服务架构
 *
 * @author NestJS Template
 * @version 1.0.0
 */
import { Injectable } from '@nestjs/common';
import * as packageJson from '../package.json';

/**
 * 应用根服务类
 *
 * 基本信息获取等通用服务
 */
@Injectable()
export class AppService {
  /**
   * 获取应用欢迎信息
   *
   * 功能:
   * - 返回应用的基本欢迎信息
   * - 用于健康检查和服务状态验证
   * - 可扩展为更复杂的应用信息获取
   *
   * @returns 欢迎信息字符串
   *
   * @example
   * ```typescript
   * const message = appService.getHello();
   * console.log(message); // "Hello NestJS-Template"
   * ```
   */
  getHello(): { message: string } {
    return {
      message: `Hello ${packageJson.name}`,
    };
  }

  /**
   * 获取应用版本信息
   *
   * 功能:
   * - 返回应用版本号
   * - 提供构建信息
   * - 支持版本管理和监控
   *
   * @returns 版本信息对象
   */
  getVersion(): { version: string; name: string; description?: string } {
    return {
      version: packageJson.version,
      name: packageJson.name,
      description: packageJson.description,
    };
  }
}
