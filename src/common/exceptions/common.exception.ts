import { HttpException, HttpStatus } from '@nestjs/common';
import { LogLevel } from './business.exception';

/**
 * 应用程序异常基类
 *
 * 为应用程序提供统一的异常处理基础，所有自定义异常都应该继承此类或其子类。
 * 提供了标准化的异常信息格式和日志记录能力。
 */
export abstract class AppException extends HttpException {
  /** 异常代码，用于程序化处理 */
  public readonly code: string;

  /** 异常上下文信息 */
  public readonly context?: Record<string, unknown>;

  /** 日志级别 */
  public readonly logLevel: LogLevel;

  /** 异常发生时间戳 */
  public readonly timestamp: number;

  constructor(
    message: string,
    status: HttpStatus,
    code: string,
    context?: Record<string, unknown>,
    logLevel: LogLevel = LogLevel.ERROR,
  ) {
    super(
      {
        code,
        message,
        timestamp: Date.now(),
      },
      status,
    );

    this.code = code;
    this.context = context;
    this.logLevel = logLevel;
    this.timestamp = Date.now();
  }
}

/**
 * 系统异常类
 *
 * 用于表示系统级别的错误，如数据库连接失败、外部服务不可用等。
 * 这类异常通常需要系统管理员介入处理。
 */
export class SystemException extends AppException {
  constructor(
    message: string,
    context?: Record<string, unknown>,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message, status, 'SYSTEM_ERROR', context, LogLevel.CRITICAL);
  }
}

/**
 * 外部服务异常类
 *
 * 用于表示调用外部服务时发生的错误，如第三方 API 调用失败、网络超时等。
 */
export class ExternalServiceException extends AppException {
  /** 外部服务名称 */
  public readonly serviceName: string;

  /** 外部服务响应状态码 */
  public readonly serviceStatus?: number;

  constructor(
    serviceName: string,
    message: string,
    serviceStatus?: number,
    context?: Record<string, unknown>,
  ) {
    super(
      `外部服务调用失败 [${serviceName}]: ${message}`,
      HttpStatus.BAD_GATEWAY,
      'EXTERNAL_SERVICE_ERROR',
      {
        serviceName,
        serviceStatus,
        ...context,
      },
      LogLevel.ERROR,
    );

    this.serviceName = serviceName;
    this.serviceStatus = serviceStatus;
  }
}

/**
 * 配置异常类
 *
 * 用于表示应用程序配置相关的错误，如缺少必要的环境变量、配置格式错误等。
 */
export class ConfigurationException extends AppException {
  /** 配置项名称 */
  public readonly configKey: string;

  constructor(configKey: string, message: string, context?: Record<string, unknown>) {
    super(
      `配置错误 [${configKey}]: ${message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'CONFIGURATION_ERROR',
      {
        configKey,
        ...context,
      },
      LogLevel.CRITICAL,
    );

    this.configKey = configKey;
  }
}

/**
 * 数据库异常类
 *
 * 用于表示数据库操作相关的错误，如连接失败、查询超时、约束违反等。
 */
export class DatabaseException extends AppException {
  /** 数据库操作类型 */
  public readonly operation: string;

  /** 原始数据库错误 */
  public readonly originalError?: Error;

  constructor(
    operation: string,
    message: string,
    originalError?: Error,
    context?: Record<string, unknown>,
  ) {
    super(
      `数据库操作失败 [${operation}]: ${message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'DATABASE_ERROR',
      {
        operation,
        originalError: originalError?.message,
        ...context,
      },
      LogLevel.ERROR,
    );

    this.operation = operation;
    this.originalError = originalError;
  }
}

/**
 * 文件操作异常类
 *
 * 用于表示文件操作相关的错误，如文件不存在、权限不足、磁盘空间不足等。
 */
export class FileOperationException extends AppException {
  /** 文件路径 */
  public readonly filePath: string;

  /** 操作类型 */
  public readonly operation: string;

  constructor(
    operation: string,
    filePath: string,
    message: string,
    context?: Record<string, unknown>,
  ) {
    const status = FileOperationException.getStatusByMessage(message);

    super(
      `文件操作失败 [${operation}]: ${message}`,
      status,
      'FILE_OPERATION_ERROR',
      {
        operation,
        filePath,
        ...context,
      },
      LogLevel.WARNING,
    );

    this.operation = operation;
    this.filePath = filePath;
  }

  /**
   * 根据错误信息推断合适的 HTTP 状态码
   */
  private static getStatusByMessage(message: string): HttpStatus {
    if (message.includes('不存在') || message.includes('not found')) {
      return HttpStatus.NOT_FOUND;
    }
    if (message.includes('权限') || message.includes('permission')) {
      return HttpStatus.FORBIDDEN;
    }
    if (message.includes('大小') || message.includes('size')) {
      return HttpStatus.PAYLOAD_TOO_LARGE;
    }
    if (message.includes('类型') || message.includes('type')) {
      return HttpStatus.UNSUPPORTED_MEDIA_TYPE;
    }
    return HttpStatus.BAD_REQUEST;
  }
}

/**
 * 网络异常类
 *
 * 用于表示网络相关的错误，如连接超时、DNS 解析失败等。
 */
export class NetworkException extends AppException {
  /** 目标地址 */
  public readonly target: string;

  /** 网络错误类型 */
  public readonly networkErrorType: string;

  constructor(
    target: string,
    networkErrorType: string,
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(
      `网络错误 [${target}]: ${message}`,
      HttpStatus.BAD_GATEWAY,
      'NETWORK_ERROR',
      {
        target,
        networkErrorType,
        ...context,
      },
      LogLevel.ERROR,
    );

    this.target = target;
    this.networkErrorType = networkErrorType;
  }
}

/**
 * 异常工厂类
 *
 * 提供创建各种常见异常的便捷方法，统一异常创建逻辑。
 */
export class ExceptionFactory {
  /**
   * 创建系统异常
   */
  static system(message: string, context?: Record<string, unknown>): SystemException {
    return new SystemException(message, context);
  }

  /**
   * 创建外部服务异常
   */
  static externalService(
    serviceName: string,
    message: string,
    serviceStatus?: number,
    context?: Record<string, unknown>,
  ): ExternalServiceException {
    return new ExternalServiceException(serviceName, message, serviceStatus, context);
  }

  /**
   * 创建配置异常
   */
  static configuration(
    configKey: string,
    message: string,
    context?: Record<string, unknown>,
  ): ConfigurationException {
    return new ConfigurationException(configKey, message, context);
  }

  /**
   * 创建数据库异常
   */
  static database(
    operation: string,
    message: string,
    originalError?: Error,
    context?: Record<string, unknown>,
  ): DatabaseException {
    return new DatabaseException(operation, message, originalError, context);
  }

  /**
   * 创建文件操作异常
   */
  static fileOperation(
    operation: string,
    filePath: string,
    message: string,
    context?: Record<string, unknown>,
  ): FileOperationException {
    return new FileOperationException(operation, filePath, message, context);
  }

  /**
   * 创建网络异常
   */
  static network(
    target: string,
    networkErrorType: string,
    message: string,
    context?: Record<string, unknown>,
  ): NetworkException {
    return new NetworkException(target, networkErrorType, message, context);
  }
}
