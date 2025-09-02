/**
 * 调试模块接口定义
 *
 * 定义调试功能相关的数据结构和类型
 *
 * @author NestJS Template
 * @version 1.0.0
 */

/**
 * 调试面板总览信息
 */
export interface DebugInfo {
  timestamp: string;
  environment: string;
  systemMetrics: SystemMetrics;
  requestSummary: RequestSummary;
  errorSummary: ErrorSummary;
}

/**
 * 系统性能指标
 */
export interface SystemMetrics {
  memory: {
    used: number; // MB
    total: number; // MB
    external: number; // MB
    rss: number; // MB
  };
  cpu: {
    user: number;
    system: number;
  };
  uptime: number; // 秒
  nodeVersion: string;
  platform: string;
}

/**
 * 请求统计摘要
 */
export interface RequestSummary {
  total: number;
  success: number;
  error: number;
  averageResponseTime: number; // 毫秒
  slowestRequest: {
    url: string;
    method: string;
    duration: number;
  } | null;
  requestsPerMinute: number;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
    averageTime: number;
  }>;
}

/**
 * 错误统计摘要
 */
export interface ErrorSummary {
  total: number;
  last24Hours: number;
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurred: string;
  }>;
  errorsByStatus: Record<number, number>;
}

/**
 * 请求追踪记录
 */
export interface RequestTrackingRecord {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number; // 毫秒
  userAgent?: string;
  ip?: string;
  userId?: string;
  requestSize?: number; // 字节
  responseSize?: number; // 字节
  headers?: Record<string, string>;
  query?: Record<string, any>;
  body?: any;
  response?: any;
  error?: string;
}

/**
 * 错误诊断记录
 */
export interface ErrorDiagnosticRecord {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'critical';
  message: string;
  stack?: string;
  context: {
    requestId?: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    method?: string;
    url?: string;
    statusCode?: number;
  };
  metadata?: Record<string, any>;
}

/**
 * 性能监控数据
 */
export interface PerformanceMetric {
  id: string;
  timestamp: string;
  type: 'request' | 'database' | 'cache' | 'external';
  name: string;
  duration: number; // 毫秒
  success: boolean;
  metadata?: Record<string, any>;
}

/**
 * 调试配置
 */
export interface DebugConfig {
  enabled: boolean;
  maxRecords: number;
  retentionDays: number;
  trackRequests: boolean;
  trackErrors: boolean;
  trackPerformance: boolean;
  sensitiveFields: string[];
}
