import { SetMetadata } from '@nestjs/common';
import { AUTH_METADATA_KEYS } from '@/common/constants';

/**
 * 公共路由标识键
 * 用于在元数据中标记路由是否为公共访问
 */
export const IS_PUBLIC_KEY = AUTH_METADATA_KEYS.IS_PUBLIC;

/**
 * 公共路由装饰器（Public）
 *
 * 用于标记无需身份认证即可访问的公共路由。
 *
 * 功能说明：
 * - 在路由元数据中设置 isPublic 标记为 true
 * - JwtAuthGuard 会检查此标记，跳过对公共路由的认证校验
 * - 适用于登录、注册、健康检查等无需认证的接口
 *
 * 用法示例：
 * ```typescript
 * @Post('login')
 * @Public()
 * login(@Body() loginDto: LoginDto) {
 *   return this.authService.login(loginDto);
 * }
 * ```
 *
 * @returns 设置公共路由元数据的装饰器
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
