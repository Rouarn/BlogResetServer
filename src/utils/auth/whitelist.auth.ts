import { WHITE_LIST_ROUTES } from 'src/common/constants';

/**
 * 白名单认证工具
 */
export class WhitelistAuth {
  /**
   * 检查路径是否在白名单中
   * @param path 请求路径
   * @returns 如果在白名单中返回 true
   */
  static isWhitelistedPath(path: string): boolean {
    return WHITE_LIST_ROUTES.some((route) => {
      // 支持通配符匹配
      if (route.endsWith('/*')) {
        const basePath = route.slice(0, -2);
        return path.startsWith(basePath);
      }
      // 精确匹配
      return path === route;
    });
  }

  /**
   * 获取所有白名单路由
   * @returns 白名单路由数组
   */
  static getWhiteListRoutes(): readonly string[] {
    return WHITE_LIST_ROUTES;
  }

  /**
   * 检查路径是否匹配特定的路由模式
   * @param path 请求路径
   * @param pattern 路由模式（支持通配符 /*）
   * @returns 如果匹配返回 true
   */
  static matchRoute(path: string, pattern: string): boolean {
    if (pattern.endsWith('/*')) {
      const basePath = pattern.slice(0, -2);
      return path.startsWith(basePath);
    }
    return path === pattern;
  }
}
