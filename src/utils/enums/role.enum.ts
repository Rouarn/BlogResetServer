/**
 * 用户角色枚举
 * 定义系统中的用户权限级别
 */
export enum Role {
  /** 超级管理员 - 拥有系统最高权限 */
  SUPER = 'R_SUPER',
  /** 管理员 - 拥有管理权限 */
  ADMIN = 'R_ADMIN',
  /** 普通用户 - 基础权限 */
  USER = 'R_USER',
}

/**
 * 角色枚举的所有可能值
 */
export const ROLE_VALUES = Object.values(Role);

/**
 * 角色枚举类型
 */
export type RoleType = typeof Role[keyof typeof Role];

/**
 * 角色显示名称映射
 */
export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER]: '超级管理员',
  [Role.ADMIN]: '管理员',
  [Role.USER]: '普通用户',
} as const;

/**
 * 角色权限级别映射（数字越大权限越高）
 */
export const ROLE_LEVELS: Record<Role, number> = {
  [Role.USER]: 1,
  [Role.ADMIN]: 2,
  [Role.SUPER]: 3,
} as const;

/**
 * 角色描述映射
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.SUPER]: '拥有系统所有权限，可以管理系统设置和所有用户',
  [Role.ADMIN]: '拥有管理权限，可以管理普通用户和业务数据',
  [Role.USER]: '基础用户权限，只能访问自己的数据',
} as const;

/**
 * 检查给定值是否为有效的角色枚举值
 * @param value - 要检查的值
 * @returns 如果是有效的角色枚举值则返回 true
 */
export function isValidRole(value: unknown): value is Role {
  return typeof value === 'string' && ROLE_VALUES.includes(value as Role);
}

/**
 * 获取角色的显示标签
 * @param role - 角色枚举值
 * @returns 对应的中文显示标签
 */
export function getRoleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? '未知角色';
}

/**
 * 获取角色的权限级别
 * @param role - 角色枚举值
 * @returns 对应的权限级别数字
 */
export function getRoleLevel(role: Role): number {
  return ROLE_LEVELS[role] ?? 0;
}

/**
 * 获取角色的描述信息
 * @param role - 角色枚举值
 * @returns 对应的角色描述
 */
export function getRoleDescription(role: Role): string {
  return ROLE_DESCRIPTIONS[role] ?? '未知角色';
}

/**
 * 比较两个角色的权限级别
 * @param roleA - 角色A
 * @param roleB - 角色B
 * @returns 如果角色A权限高于角色B返回正数，相等返回0，低于返回负数
 */
export function compareRoles(roleA: Role, roleB: Role): number {
  return getRoleLevel(roleA) - getRoleLevel(roleB);
}

/**
 * 检查角色A是否有权限管理角色B
 * @param managerRole - 管理者角色
 * @param targetRole - 目标角色
 * @returns 如果有权限则返回 true
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  return getRoleLevel(managerRole) > getRoleLevel(targetRole);
}

/**
 * 从字符串解析角色枚举
 * @param roleStr - 角色字符串
 * @returns 对应的角色枚举值，无法解析时返回 USER
 */
export function parseRole(roleStr: string): Role {
  const upperStr = roleStr.toUpperCase().trim();
  
  // 直接匹配枚举值
  if (ROLE_VALUES.includes(upperStr as Role)) {
    return upperStr as Role;
  }
  
  // 匹配简化形式
  switch (upperStr) {
    case 'SUPER':
    case 'SUPERADMIN':
    case 'ROOT':
      return Role.SUPER;
    case 'ADMIN':
    case 'ADMINISTRATOR':
      return Role.ADMIN;
    case 'USER':
    case 'MEMBER':
    default:
      return Role.USER;
  }
}

/**
 * 获取所有角色选项（用于表单选择）
 * @returns 包含值、标签和级别的选项数组
 */
export function getRoleOptions(): Array<{ 
  value: Role; 
  label: string; 
  level: number; 
  description: string 
}> {
  return ROLE_VALUES.map(value => ({
    value,
    label: getRoleLabel(value),
    level: getRoleLevel(value),
    description: getRoleDescription(value),
  })).sort((a, b) => b.level - a.level); // 按权限级别降序排列
}

/**
 * 获取低于指定角色权限的所有角色
 * @param role - 指定角色
 * @returns 权限低于指定角色的角色数组
 */
export function getSubordinateRoles(role: Role): Role[] {
  const currentLevel = getRoleLevel(role);
  return ROLE_VALUES.filter(r => getRoleLevel(r) < currentLevel);
}
