import { WHITE_LIST_ROUTES } from '@/common/constants';

/**
 * 白名单认证工具类
 *
 * @description
 * 提供路由白名单检查和匹配功能的工具类
 * 用于判断请求路径是否需要进行身份认证
 * 支持精确匹配和通配符模式匹配
 *
 * 功能特性:
 * - 路径白名单检查
 * - 通配符路由匹配 (支持 /* 模式)
 * - 精确路径匹配
 * - 白名单路由获取
 * - 自定义路由模式匹配
 *
 * 使用场景:
 * - JWT认证守卫中的路径过滤
 * - 权限控制中的公共路由判断
 * - API网关的路由白名单检查
 * - 中间件中的认证跳过逻辑
 *
 * 安全注意事项:
 * - 白名单路由应该最小化和精确化
 * - 避免过于宽泛的通配符匹配
 * - 定期审查白名单的必要性
 * - 敏感操作不应加入白名单
 *
 * @example
 * ```typescript
 * import { WhitelistAuth } from '@/utils/auth';
 *
 * // 检查路径是否在白名单中
 * const isPublic = WhitelistAuth.isWhitelistedPath('/auth/login');
 *
 * // 获取所有白名单路由
 * const routes = WhitelistAuth.getWhiteListRoutes();
 *
 * // 自定义路由匹配
 * const matches = WhitelistAuth.matchRoute('/api/public/data', '/api/public/*');
 * ```
 *
 * @author NestJS Template
 * @since 1.0.0
 */
export class WhitelistAuth {
  /**
   * 检查请求路径是否在认证白名单中
   *
   * @description
   * 根据预定义的白名单路由配置，检查给定路径是否无需身份认证。
   * 支持两种匹配模式：精确匹配和通配符前缀匹配。
   *
   * 匹配规则:
   * 1. 精确匹配: 路径与白名单项完全相同
   * 2. 通配符匹配: 白名单项以 /* 结尾时，匹配路径前缀
   *
   * 性能优化:
   * - 使用 Array.some() 进行短路求值
   * - 优先进行字符串比较，减少计算开销
   * - 通配符匹配仅在必要时进行字符串截取
   *
   * @param path 需要检查的请求路径 (如: '/auth/login', '/api/users/123')
   * @returns boolean 如果路径在白名单中返回 true，否则返回 false
   *
   * @example
   * ```typescript
   * // 精确匹配示例
   * WhitelistAuth.isWhitelistedPath('/auth/login');     // true (如果在白名单中)
   * WhitelistAuth.isWhitelistedPath('/api/users');      // false (如果不在白名单中)
   *
   * // 通配符匹配示例 (假设白名单中有 '/public/*')
   * WhitelistAuth.isWhitelistedPath('/public/images');  // true
   * WhitelistAuth.isWhitelistedPath('/public/css/app'); // true
   * WhitelistAuth.isWhitelistedPath('/private/data');   // false
   *
   * // 在认证守卫中使用
   * @Injectable()
   * export class JwtAuthGuard extends AuthGuard('jwt') {
   *   canActivate(context: ExecutionContext): boolean {
   *     const request = context.switchToHttp().getRequest();
   *     const path = request.url.split('?')[0]; // 移除查询参数
   *
   *     if (WhitelistAuth.isWhitelistedPath(path)) {
   *       return true; // 跳过JWT认证
   *     }
   *
   *     return super.canActivate(context);
   *   }
   * }
   * ```
   *
   * @see WHITE_LIST_ROUTES 白名单路由常量配置
   * @see getWhiteListRoutes 获取完整白名单列表
   * @see matchRoute 自定义路由模式匹配
   */
  static isWhitelistedPath(path: string): boolean {
    return WHITE_LIST_ROUTES.some((route) => {
      // 通配符前缀匹配 (路由以 /* 结尾)
      if (route.endsWith('/*')) {
        const basePath = route.slice(0, -2);
        return path.startsWith(basePath);
      }
      // 精确路径匹配
      return path === route;
    });
  }

  /**
   * 获取所有白名单路由配置
   *
   * @description
   * 返回系统中配置的所有白名单路由列表。
   * 返回的数组是只读的，防止外部代码意外修改白名单配置。
   *
   * 用途:
   * - 调试和日志记录白名单配置
   * - 动态路由配置验证
   * - 系统配置审计和检查
   * - 开发工具中的配置展示
   *
   * 安全考虑:
   * - 返回只读数组，防止意外修改
   * - 不暴露内部实现细节
   * - 可用于配置验证和审计
   *
   * @returns readonly string[] 只读的白名单路由数组
   *
   * @example
   * ```typescript
   * // 获取所有白名单路由
   * const whitelistRoutes = WhitelistAuth.getWhiteListRoutes();
   * console.log('当前白名单路由:', whitelistRoutes);
   *
   * // 用于配置验证
   * const validateWhitelist = () => {
   *   const routes = WhitelistAuth.getWhiteListRoutes();
   *   routes.forEach(route => {
   *     if (route.includes('admin')) {
   *       console.warn(`警告: 管理员路由 ${route} 在白名单中`);
   *     }
   *   });
   * };
   *
   * // 用于调试输出
   * const debugAuth = (path: string) => {
   *   const isWhitelisted = WhitelistAuth.isWhitelistedPath(path);
   *   const allRoutes = WhitelistAuth.getWhiteListRoutes();
   *   console.log(`路径: ${path}`);
   *   console.log(`是否在白名单: ${isWhitelisted}`);
   *   console.log(`所有白名单路由:`, allRoutes);
   * };
   * ```
   *
   * @see WHITE_LIST_ROUTES 白名单路由常量定义
   * @see isWhitelistedPath 路径白名单检查方法
   */
  static getWhiteListRoutes(): readonly string[] {
    return WHITE_LIST_ROUTES;
  }

  /**
   * 检查路径是否匹配指定的路由模式
   *
   * @description
   * 提供灵活的路由模式匹配功能，支持精确匹配和通配符前缀匹配。
   * 这是一个通用的路由匹配工具，可以用于自定义的路由检查逻辑。
   *
   * 匹配模式:
   * 1. 精确匹配: pattern 不包含通配符时，进行完全相等比较
   * 2. 前缀匹配: pattern 以 /* 结尾时，匹配路径前缀
   *
   * 使用场景:
   * - 自定义权限检查逻辑
   * - 动态路由规则验证
   * - 中间件中的路径过滤
   * - API网关的路由匹配
   * - 缓存策略的路径分组
   *
   * 性能特点:
   * - 字符串操作优化，避免正则表达式开销
   * - 短路求值，提高匹配效率
   * - 内存友好，不创建不必要的中间对象
   *
   * @param path 需要检查的请求路径 (如: '/api/users/123', '/public/images/logo.png')
   * @param pattern 路由匹配模式 (如: '/api/users', '/public/*', '/auth/login')
   * @returns boolean 如果路径匹配模式返回 true，否则返回 false
   *
   * @example
   * ```typescript
   * // 精确匹配示例
   * WhitelistAuth.matchRoute('/auth/login', '/auth/login');     // true
   * WhitelistAuth.matchRoute('/auth/logout', '/auth/login');    // false
   *
   * // 通配符前缀匹配示例
   * WhitelistAuth.matchRoute('/api/users/123', '/api/*');       // true
   * WhitelistAuth.matchRoute('/api/posts/456', '/api/*');       // true
   * WhitelistAuth.matchRoute('/public/css/app.css', '/public/*'); // true
   * WhitelistAuth.matchRoute('/private/data', '/public/*');     // false
   *
   * // 在自定义权限检查中使用
   * const checkCustomPermission = (userRole: string, path: string): boolean => {
   *   const adminPatterns = ['/admin/*', '/system/*'];
   *   const userPatterns = ['/profile/*', '/settings/*'];
   *
   *   if (userRole === 'admin') {
   *     return adminPatterns.some(pattern =>
   *       WhitelistAuth.matchRoute(path, pattern)
   *     );
   *   }
   *
   *   if (userRole === 'user') {
   *     return userPatterns.some(pattern =>
   *       WhitelistAuth.matchRoute(path, pattern)
   *     );
   *   }
   *
   *   return false;
   * };
   *
   * // 在路由分组中使用
   * const categorizeRoute = (path: string): string => {
   *   if (WhitelistAuth.matchRoute(path, '/api/*')) return 'API';
   *   if (WhitelistAuth.matchRoute(path, '/admin/*')) return 'Admin';
   *   if (WhitelistAuth.matchRoute(path, '/public/*')) return 'Public';
   *   return 'Other';
   * };
   * ```
   *
   * @see isWhitelistedPath 白名单路径检查 (使用预定义白名单)
   * @see getWhiteListRoutes 获取系统白名单配置
   */
  static matchRoute(path: string, pattern: string): boolean {
    if (pattern.endsWith('/*')) {
      const basePath = pattern.slice(0, -2);
      return path.startsWith(basePath);
    }
    return path === pattern;
  }
}
