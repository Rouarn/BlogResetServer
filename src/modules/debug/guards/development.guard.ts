/**
 * 开发环境守卫
 * 
 * 功能说明:
 * - 限制调试功能仅在开发环境中可用
 * - 防止生产环境暴露调试信息
 * - 基于配置服务进行访问控制
 * 
 * 使用场景:
 * - 调试控制器端点保护
 * - 开发工具访问限制
 * - 敏感调试信息安全控制
 * 
 * 环境检测逻辑:
 * - 通过配置服务检查调试开关
 * - 支持细粒度的功能控制
 * - 默认拒绝访问（安全优先）
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class DevelopmentGuard implements CanActivate {
  private readonly logger = new Logger(DevelopmentGuard.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * 检查是否允许访问调试功能
   * 
   * @param context 执行上下文
   * @returns 是否允许访问
   */
  canActivate(context: ExecutionContext): boolean {
    // 检查调试模式是否启用
    const debugEnabled = this.configService.get<boolean>('app.debug.enabled', false);
    const panelEnabled = this.configService.get<boolean>('app.debug.panelEnabled', false);
    
    // 允许访问当调试模式和面板都启用时
    const isAllowed = debugEnabled && panelEnabled;
    
    if (!isAllowed) {
      const request = context.switchToHttp().getRequest<Request>();
      this.logger.warn(
        `调试功能访问被拒绝 - 调试模式未启用`,
        {
          ip: request.ip,
          userAgent: request.get('User-Agent'),
          url: request.url,
          method: request.method,
          debugEnabled,
          panelEnabled,
        },
      );
      
      throw new ForbiddenException({
        code: 'DEBUG_ACCESS_DENIED',
        message: '调试功能未启用',
        timestamp: new Date().toISOString(),
      });
    }

    return true;
  }

  /**
   * 检查是否为开发环境
   */
  private isDevelopmentEnvironment(): boolean {
    const nodeEnv = this.configService.get('NODE_ENV', 'development');
    const appEnv = this.configService.get('APP_ENV', 'development');
    
    // 允许的开发环境标识
    const developmentEnvs = ['development', 'dev', 'local', 'test'];
    
    return (
      developmentEnvs.includes(nodeEnv.toLowerCase()) ||
      developmentEnvs.includes(appEnv.toLowerCase())
    );
  }

  /**
   * 静态方法：检查是否为开发环境
   */
  static isDevelopment(configService: ConfigService): boolean {
    const nodeEnv = configService.get('NODE_ENV', 'development');
    const appEnv = configService.get('APP_ENV', 'development');
    
    const developmentEnvs = ['development', 'dev', 'local', 'test'];
    
    return (
      developmentEnvs.includes(nodeEnv.toLowerCase()) ||
      developmentEnvs.includes(appEnv.toLowerCase())
    );
  }
}