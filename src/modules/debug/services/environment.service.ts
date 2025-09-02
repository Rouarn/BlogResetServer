/**
 * 环境配置服务
 *
 * 功能说明:
 * - 统一管理环境检测和配置
 * - 提供调试功能的环境控制
 * - 支持细粒度的功能开关
 *
 * 配置特点:
 * - 基于配置服务的统一管理
 * - 支持开发/生产环境自动切换
 * - 提供静态和实例方法
 *
 * @author NestJS Template
 * @version 1.0.0
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentService {
  private readonly logger = new Logger(EnvironmentService.name);

  constructor(private readonly configService: ConfigService) {
    this.logEnvironmentInfo();
  }

  /**
   * 检查是否为开发环境
   */
  isDevelopment(): boolean {
    const environment = this.configService.get<string>('app.environment', 'development');
    return environment === 'development';
  }

  /**
   * 检查是否为生产环境
   */
  isProduction(): boolean {
    const environment = this.configService.get<string>('app.environment', 'development');
    return environment === 'production';
  }

  /**
   * 检查调试模式是否启用
   */
  isDebugEnabled(): boolean {
    return this.configService.get<boolean>('app.debug.enabled', false);
  }

  /**
   * 检查性能监控是否启用
   */
  isPerformanceMonitoringEnabled(): boolean {
    return this.configService.get<boolean>('app.debug.performanceMonitoring', false);
  }

  /**
   * 检查请求追踪是否启用
   */
  isRequestTrackingEnabled(): boolean {
    return this.configService.get<boolean>('app.debug.requestTracking', false);
  }

  /**
   * 检查详细错误信息是否启用
   */
  isDetailedErrorsEnabled(): boolean {
    return this.configService.get<boolean>('app.debug.detailedErrors', false);
  }

  /**
   * 检查调试面板是否启用
   */
  isDebugPanelEnabled(): boolean {
    return this.configService.get<boolean>('app.debug.panelEnabled', false);
  }

  /**
   * 获取日志级别
   */
  getLogLevel(): string {
    return this.configService.get<string>('app.debug.logLevel', 'error');
  }

  /**
   * 获取当前环境名称
   */
  getEnvironment(): string {
    return this.configService.get<string>('app.environment', 'development');
  }

  /**
   * 获取调试配置摘要
   */
  getDebugConfig(): {
    environment: string;
    debugEnabled: boolean;
    performanceMonitoring: boolean;
    requestTracking: boolean;
    detailedErrors: boolean;
    panelEnabled: boolean;
    logLevel: string;
  } {
    return {
      environment: this.getEnvironment(),
      debugEnabled: this.isDebugEnabled(),
      performanceMonitoring: this.isPerformanceMonitoringEnabled(),
      requestTracking: this.isRequestTrackingEnabled(),
      detailedErrors: this.isDetailedErrorsEnabled(),
      panelEnabled: this.isDebugPanelEnabled(),
      logLevel: this.getLogLevel(),
    };
  }

  /**
   * 记录环境信息
   */
  private logEnvironmentInfo(): void {
    const config = this.getDebugConfig();

    // 美化的环境配置输出
    this.logger.log('');
    this.logger.log('┌─ 🔧 调试模块环境配置 ' + '─'.repeat(36) + '┐');
    this.logger.log(`│ 🌍 运行环境: ${config.environment}`);
    this.logger.log(`│ 🐛 调试模式: ${config.debugEnabled ? '✅ 已启用' : '❌ 已禁用'}`);
    this.logger.log(`│ ⚡ 性能监控: ${config.performanceMonitoring ? '✅ 已启用' : '❌ 已禁用'}`);
    this.logger.log(`│ 📊 请求追踪: ${config.requestTracking ? '✅ 已启用' : '❌ 已禁用'}`);
    this.logger.log(`│ 🔍 详细错误: ${config.detailedErrors ? '✅ 已启用' : '❌ 已禁用'}`);
    this.logger.log(`│ 🎛️  调试面板: ${config.panelEnabled ? '✅ 已启用' : '❌ 已禁用'}`);
    this.logger.log(`│ 📝 日志级别: ${config.logLevel}`);
    this.logger.log('└' + '─'.repeat(58) + '┘');
    this.logger.log('');

    // 在生产环境中警告如果调试功能仍然启用
    if (this.isProduction() && this.isDebugEnabled()) {
      this.logger.warn('');
      this.logger.warn('⚠️  警告: 生产环境中检测到调试功能已启用');
      this.logger.warn('🔒 建议在生产环境中禁用调试功能以确保安全性');
      this.logger.warn('');
    }
  }

  /**
   * 静态方法：快速检查是否为开发环境
   */
  static isDevelopment(configService: ConfigService): boolean {
    const environment = configService.get<string>('app.environment', 'development');
    return environment === 'development';
  }

  /**
   * 静态方法：快速检查调试是否启用
   */
  static isDebugEnabled(configService: ConfigService): boolean {
    return configService.get<boolean>('app.debug.enabled', false);
  }
}
