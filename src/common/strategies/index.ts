/**
 * 认证策略模块导出
 * 
 * 统一导出所有 Passport 认证策略，用于用户身份验证。
 * 
 * 包含策略：
 * - JwtAuthStrategy: JWT 认证策略，用于解析和验证 JWT Token
 * 
 * 用法示例：
 * import { JwtAuthStrategy } from '@/common/strategies';
 */
export * from './jwt-auth.strategy';