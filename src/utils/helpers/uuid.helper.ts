import {
  NIL as NIL_UUID,
  v1 as uuidv1,
  v3 as uuidv3,
  v4 as uuidv4,
  v5 as uuidv5,
  v6 as uuidv6,
  v7 as uuidv7,
  validate,
  version,
} from 'uuid';

/**
 * UUID 版本枚举
 */
export enum UUIDVersion {
  V1 = 1,
  V3 = 3,
  V4 = 4,
  V5 = 5,
  V6 = 6,
  V7 = 7,
}

/**
 * UUID 生成选项
 */
export interface UUIDOptions {
  /** 节点 ID (仅用于 v1 和 v6) */
  node?: Buffer;
  /** 时钟序列 (仅用于 v1 和 v6) */
  clockseq?: number;
  /** 时间戳 (仅用于 v1 和 v6) */
  msecs?: number;
  /** 纳秒 (仅用于 v1 和 v6) */
  nsecs?: number;
  /** 随机数或伪随机数生成器 (仅用于 v4) */
  random?: Uint8Array;
  /** 随机数生成器函数 (仅用于 v4) */
  rng?: () => Uint8Array;
}

/**
 * 生成 UUID v4 (随机) - 保持原有函数名兼容性
 * @param options 生成选项
 * @returns UUID 字符串
 */
export const uuid = (options?: UUIDOptions): string => {
  return uuidv4(options);
};

/**
 * 生成 UUID v4 (随机)
 * @param options 生成选项
 * @returns UUID 字符串
 */
export function generateUUID(options?: UUIDOptions): string {
  return uuidv4(options);
}

/**
 * 生成 UUID v1 (基于时间戳和 MAC 地址)
 * @param options 生成选项
 * @returns UUID 字符串
 */
export function generateUUIDv1(options?: UUIDOptions): string {
  return uuidv1(options);
}

/**
 * 生成 UUID v3 (基于命名空间和名称的 MD5 哈希)
 * @param name 名称
 * @param namespace 命名空间 UUID
 * @returns UUID 字符串
 */
export function generateUUIDv3(name: string, namespace: string): string {
  return uuidv3(name, namespace);
}

/**
 * 生成 UUID v4 (随机)
 * @param options 生成选项
 * @returns UUID 字符串
 */
export function generateUUIDv4(options?: UUIDOptions): string {
  return uuidv4(options);
}

/**
 * 生成 UUID v5 (基于命名空间和名称的 SHA-1 哈希)
 * @param name 名称
 * @param namespace 命名空间 UUID
 * @returns UUID 字符串
 */
export function generateUUIDv5(name: string, namespace: string): string {
  return uuidv5(name, namespace);
}

/**
 * 生成 UUID v6 (基于时间戳，重新排序的 v1)
 * @param options 生成选项
 * @returns UUID 字符串
 */
export function generateUUIDv6(options?: UUIDOptions): string {
  return uuidv6(options);
}

/**
 * 生成 UUID v7 (基于 Unix 时间戳)
 * @param options 生成选项
 * @returns UUID 字符串
 */
export function generateUUIDv7(options?: UUIDOptions): string {
  return uuidv7(options);
}

/**
 * 根据版本生成 UUID
 * @param version UUID 版本
 * @param nameOrOptions 名称或选项
 * @param namespace 命名空间 (仅用于 v3 和 v5)
 * @returns UUID 字符串
 */
export function generateUUIDByVersion(
  version: UUIDVersion,
  nameOrOptions?: string | UUIDOptions,
  namespace?: string,
): string {
  switch (version) {
    case UUIDVersion.V1:
      return generateUUIDv1(nameOrOptions as UUIDOptions);
    case UUIDVersion.V3:
      if (typeof nameOrOptions !== 'string' || !namespace) {
        throw new Error('UUID v3 requires name and namespace parameters');
      }
      return generateUUIDv3(nameOrOptions, namespace);
    case UUIDVersion.V4:
      return generateUUIDv4(nameOrOptions as UUIDOptions);
    case UUIDVersion.V5:
      if (typeof nameOrOptions !== 'string' || !namespace) {
        throw new Error('UUID v5 requires name and namespace parameters');
      }
      return generateUUIDv5(nameOrOptions, namespace);
    case UUIDVersion.V6:
      return generateUUIDv6(nameOrOptions as UUIDOptions);
    case UUIDVersion.V7:
      return generateUUIDv7(nameOrOptions as UUIDOptions);
    default:
      throw new Error(`Unsupported UUID version: ${version}`);
  }
}

/**
 * 验证 UUID 格式
 * @param uuid UUID 字符串
 * @returns 是否为有效 UUID
 */
export function isValidUUID(uuid: string): boolean {
  return validate(uuid);
}

/**
 * 获取 UUID 版本
 * @param uuid UUID 字符串
 * @returns UUID 版本号，如果无效则返回 null
 */
export function getUUIDVersion(uuid: string): number | null {
  if (!isValidUUID(uuid)) {
    return null;
  }
  return version(uuid);
}

/**
 * 检查是否为 NIL UUID (全零 UUID)
 * @param uuid UUID 字符串
 * @returns 是否为 NIL UUID
 */
export function isNilUUID(uuid: string): boolean {
  return uuid === NIL_UUID;
}

/**
 * 获取 NIL UUID (全零 UUID)
 * @returns NIL UUID 字符串
 */
export function getNilUUID(): string {
  return NIL_UUID;
}

/**
 * 格式化 UUID (移除连字符)
 * @param uuid UUID 字符串
 * @returns 格式化后的 UUID 字符串
 */
export function formatUUID(uuid: string, removeHyphens: boolean = false): string {
  if (!isValidUUID(uuid)) {
    throw new Error('Invalid UUID format');
  }
  return removeHyphens ? uuid.replace(/-/g, '') : uuid;
}

/**
 * 解析 UUID (添加连字符)
 * @param uuid 无连字符的 UUID 字符串
 * @returns 标准格式的 UUID 字符串
 */
export function parseUUID(uuid: string): string {
  // 移除现有连字符
  const cleanUuid = uuid.replace(/-/g, '');

  // 检查长度
  if (cleanUuid.length !== 32) {
    throw new Error('Invalid UUID length');
  }

  // 添加连字符
  const formattedUuid = [
    cleanUuid.slice(0, 8),
    cleanUuid.slice(8, 12),
    cleanUuid.slice(12, 16),
    cleanUuid.slice(16, 20),
    cleanUuid.slice(20, 32),
  ].join('-');

  if (!isValidUUID(formattedUuid)) {
    throw new Error('Invalid UUID format');
  }

  return formattedUuid;
}

/**
 * 常用的命名空间 UUID
 */
export const NAMESPACE_UUID = {
  /** DNS 命名空间 */
  DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  /** URL 命名空间 */
  URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  /** ISO OID 命名空间 */
  OID: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  /** X.500 DN 命名空间 */
  X500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
} as const;

/**
 * UUID 工具类
 */
export class UUIDUtil {
  /**
   * 生成短 UUID (base62 编码)
   * @returns 短 UUID 字符串
   */
  static generateShortUUID(): string {
    const uuid = generateUUIDv4();
    const hex = uuid.replace(/-/g, '');
    const bigInt = BigInt('0x' + hex);
    return UUIDUtil.toBase62(bigInt);
  }

  /**
   * 批量生成 UUID
   * @param count 生成数量
   * @param version UUID 版本
   * @returns UUID 数组
   */
  static generateBatch(count: number, version: UUIDVersion = UUIDVersion.V4): string[] {
    const uuids: string[] = [];
    for (let i = 0; i < count; i++) {
      uuids.push(generateUUIDByVersion(version));
    }
    return uuids;
  }

  /**
   * 验证 UUID 数组
   * @param uuids UUID 数组
   * @returns 验证结果
   */
  static validateBatch(uuids: string[]): {
    valid: string[];
    invalid: string[];
  } {
    const valid: string[] = [];
    const invalid: string[] = [];

    uuids.forEach((uuid) => {
      if (isValidUUID(uuid)) {
        valid.push(uuid);
      } else {
        invalid.push(uuid);
      }
    });

    return { valid, invalid };
  }

  /**
   * 将数字转换为 base62 字符串
   * @param num 数字
   * @returns base62 字符串
   */
  private static toBase62(num: bigint): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';

    while (num > 0) {
      result = chars[Number(num % 62n)] + result;
      num = num / 62n;
    }

    return result || '0';
  }
}

// 导出常用函数的别名
export {
  generateUUID as uuidGenerator,
  generateUUIDv4 as uuidv4,
  isValidUUID as validateUUID,
  NIL_UUID as nilUUID,
};
