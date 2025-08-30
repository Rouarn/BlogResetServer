/**
 * 应用根控制器
 *
 * 功能说明:
 * - 提供应用的基础 API 接口
 * - 健康检查和状态监控
 * - 欢迎页面和基本信息展示
 *
 * 特点:
 * - 公共访问，无需认证
 * - 集成 Swagger 文档
 * - 简单的状态检查接口
 *
 * @author NestJS Template
 * @version 1.0.0
 */
import { Public } from 'src/common/decorators';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

/**
 * 应用根控制器
 * 处理应用级别的基础请求
 */
@ApiTags('应用')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * 获取应用欢迎信息
   *
   * 用途:
   * - 验证应用是否正常运行
   * - 提供基本的健康检查
   * - 展示应用基本信息
   *
   * @returns 欢迎信息字符串
   */
  @ApiOperation({
    summary: '获取欢迎信息',
    description: '返回应用的欢迎信息，用于健康检查和状态验证',
  })
  @ApiResponse({
    status: 200,
    description: '成功返回欢迎信息',
    schema: {
      type: 'string',
      example: 'Hello NestJS-Template',
    },
  })
  @Public() // 公共接口，无需认证
  @Get()
  getHello(): { message: string } {
    return this.appService.getHello();
  }

  /**
   * 获取应用版本信息
   *
   * 用途:
   * - 提供应用的版本号
   * - 用于版本管理和监控
   * - 展示应用的构建信息
   *
   * @returns 版本信息对象
   */
  @ApiOperation({
    summary: '获取版本信息',
    description: '返回应用的版本号和构建信息',
  })
  @ApiResponse({
    status: 200,
    description: '成功返回版本信息',
    schema: {
      type: 'object',
      example: {
        version: '1.0.0',
        name: 'NestJS-Template',
        description: 'NestJS 应用模板',
      },
    },
  })
  @Public() // 公共接口，无需认证
  @Get('version')
  getVersion(): { version: string; name: string; description?: string } {
    return this.appService.getVersion();
  }
}
