/**
 * 认证工具模块
 * 
 * 提供认证相关的工具函数和类，包括：
 * - 白名单路由检查
 * - 路径匹配工具
 * - 认证状态判断
 * 
 * @example
 * ```typescript
 * import { WhitelistAuth } from '@/utils/auth';
 * 
 * // 检查路径是否在白名单中
 * const isWhitelisted = WhitelistAuth.isWhitelistedPath('/login/code');
 * ```
 */

export * from './whitelist.auth';