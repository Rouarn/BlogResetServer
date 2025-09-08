/**
 * 用户角色系统
 * 提供通用的角色管理和权限控制功能
 * 适用于各种业务场景的模板系统
 */

/**
 * 系统角色枚举
 * 定义了系统中的标准角色类型
 */
export enum Role {
  /** 系统管理员 - 拥有系统最高权限，可管理所有功能和用户 */
  SYSTEM_ADMIN = 'system_admin',
  /** 组织管理员 - 管理组织内的用户和资源 */
  ORG_ADMIN = 'org_admin',
  /** 部门管理员 - 管理部门内的用户和业务 */
  DEPT_ADMIN = 'dept_admin',
  /** 项目管理员 - 管理项目相关的用户和资源 */
  PROJECT_ADMIN = 'project_admin',
  /** 高级用户 - 拥有扩展功能权限 */
  POWER_USER = 'power_user',
  /** 标准用户 - 基础业务功能权限 */
  USER = 'user',
  /** 只读用户 - 仅查看权限 */
  VIEWER = 'viewer',
  /** 访客 - 最低权限，临时访问 */
  GUEST = 'guest',
}

/**
 * 角色权限级别定义
 * 数字越大权限越高，用于权限比较和继承
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SYSTEM_ADMIN]: 100,
  [Role.ORG_ADMIN]: 80,
  [Role.DEPT_ADMIN]: 60,
  [Role.PROJECT_ADMIN]: 50,
  [Role.POWER_USER]: 40,
  [Role.USER]: 20,
  [Role.VIEWER]: 10,
  [Role.GUEST]: 1,
} as const;

/**
 * 角色显示信息配置
 */
export const ROLE_CONFIG: Record<
  Role,
  {
    label: string;
    description: string;
    color: string;
    icon?: string;
  }
> = {
  [Role.SYSTEM_ADMIN]: {
    label: '系统管理员',
    description: '拥有系统最高权限，可管理所有功能、用户和系统设置',
    color: '#ff4d4f',
    icon: 'crown',
  },
  [Role.ORG_ADMIN]: {
    label: '组织管理员',
    description: '管理组织架构、用户分配和组织级别的配置',
    color: '#fa8c16',
    icon: 'team',
  },
  [Role.DEPT_ADMIN]: {
    label: '部门管理员',
    description: '管理部门内的用户、业务流程和部门资源',
    color: '#faad14',
    icon: 'apartment',
  },
  [Role.PROJECT_ADMIN]: {
    label: '项目管理员',
    description: '管理项目团队、项目资源和项目相关的业务功能',
    color: '#52c41a',
    icon: 'project',
  },
  [Role.POWER_USER]: {
    label: '高级用户',
    description: '拥有扩展功能权限，可使用高级业务功能',
    color: '#1890ff',
    icon: 'star',
  },
  [Role.USER]: {
    label: '标准用户',
    description: '拥有基础业务功能权限，可进行日常操作',
    color: '#722ed1',
    icon: 'user',
  },
  [Role.VIEWER]: {
    label: '只读用户',
    description: '仅拥有查看权限，无法进行修改操作',
    color: '#13c2c2',
    icon: 'eye',
  },
  [Role.GUEST]: {
    label: '访客',
    description: '临时访问权限，功能受限',
    color: '#8c8c8c',
    icon: 'user-add',
  },
} as const;

/**
 * 角色分组定义
 * 用于角色管理和权限分类
 */
export const ROLE_GROUPS = {
  ADMIN: [Role.SYSTEM_ADMIN, Role.ORG_ADMIN, Role.DEPT_ADMIN, Role.PROJECT_ADMIN],
  BUSINESS: [Role.POWER_USER, Role.USER],
  READONLY: [Role.VIEWER, Role.GUEST],
} as const;

/**
 * 角色类型定义
 */
export type RoleType = keyof typeof Role;
export type RoleValue = `${Role}`;
export type RoleGroup = keyof typeof ROLE_GROUPS;

/**
 * 获取所有角色值
 */
export const ROLE_VALUES = Object.values(Role);

/**
 * 角色工具类
 */
export class RoleUtils {
  /**
   * 验证角色是否有效
   */
  static isValidRole(value: unknown): value is Role {
    return typeof value === 'string' && ROLE_VALUES.includes(value as Role);
  }

  /**
   * 获取角色层级等级
   */
  static getRoleLevel(role: Role): number {
    return ROLE_HIERARCHY[role] ?? 0;
  }

  /**
   * 获取角色配置信息
   */
  static getRoleConfig(role: Role) {
    return (
      ROLE_CONFIG[role] ?? {
        label: '未知角色',
        description: '未定义的角色类型',
        color: '#d9d9d9',
      }
    );
  }

  /**
   * 获取角色显示标签
   */
  static getRoleLabel(role: Role): string {
    return this.getRoleConfig(role).label;
  }

  /**
   * 获取角色描述
   */
  static getRoleDescription(role: Role): string {
    return this.getRoleConfig(role).description;
  }

  /**
   * 比较两个角色的权限级别
   * @returns 正数表示roleA权限更高，0表示相等，负数表示roleB权限更高
   */
  static compareRoles(roleA: Role, roleB: Role): number {
    return this.getRoleLevel(roleA) - this.getRoleLevel(roleB);
  }

  /**
   * 检查角色A是否有权限管理角色B
   */
  static canManageRole(managerRole: Role, targetRole: Role): boolean {
    return this.getRoleLevel(managerRole) > this.getRoleLevel(targetRole);
  }

  /**
   * 检查角色是否属于管理员组
   */
  static isAdminRole(role: Role): boolean {
    return (ROLE_GROUPS.ADMIN as readonly Role[]).includes(role);
  }

  /**
   * 检查角色是否属于业务用户组
   */
  static isBusinessRole(role: Role): boolean {
    return (ROLE_GROUPS.BUSINESS as readonly Role[]).includes(role);
  }

  /**
   * 检查角色是否为只读权限
   */
  static isReadOnlyRole(role: Role): boolean {
    return (ROLE_GROUPS.READONLY as readonly Role[]).includes(role);
  }

  /**
   * 获取角色所属分组
   */
  static getRoleGroup(role: Role): RoleGroup | null {
    for (const [groupName, roles] of Object.entries(ROLE_GROUPS)) {
      if ((roles as readonly Role[]).includes(role)) {
        return groupName as RoleGroup;
      }
    }
    return null;
  }

  /**
   * 获取指定角色可以管理的所有下级角色
   */
  static getManageableRoles(managerRole: Role): Role[] {
    const managerLevel = this.getRoleLevel(managerRole);
    return ROLE_VALUES.filter((role) => this.getRoleLevel(role) < managerLevel);
  }

  /**
   * 获取指定角色的上级角色列表
   */
  static getSuperiorRoles(role: Role): Role[] {
    const currentLevel = this.getRoleLevel(role);
    return ROLE_VALUES.filter((r) => this.getRoleLevel(r) > currentLevel);
  }

  /**
   * 从字符串解析角色
   */
  static parseRole(roleStr: string): Role | null {
    const normalizedStr = roleStr.toLowerCase().trim();

    // 直接匹配
    if (this.isValidRole(normalizedStr)) {
      return normalizedStr;
    }

    // 别名匹配
    const aliasMap: Record<string, Role> = {
      admin: Role.SYSTEM_ADMIN,
      administrator: Role.SYSTEM_ADMIN,
      root: Role.SYSTEM_ADMIN,
      super: Role.SYSTEM_ADMIN,
      org: Role.ORG_ADMIN,
      organization: Role.ORG_ADMIN,
      dept: Role.DEPT_ADMIN,
      department: Role.DEPT_ADMIN,
      project: Role.PROJECT_ADMIN,
      pm: Role.PROJECT_ADMIN,
      power: Role.POWER_USER,
      advanced: Role.POWER_USER,
      normal: Role.USER,
      member: Role.USER,
      read: Role.VIEWER,
      readonly: Role.VIEWER,
      view: Role.VIEWER,
      visitor: Role.GUEST,
      temp: Role.GUEST,
    };

    return aliasMap[normalizedStr] ?? null;
  }

  /**
   * 获取角色选项列表（用于表单选择）
   */
  static getRoleOptions(includeGroups: RoleGroup[] = ['ADMIN', 'BUSINESS', 'READONLY']) {
    const allowedRoles = includeGroups.flatMap((group) => ROLE_GROUPS[group]);

    return allowedRoles
      .map((role) => ({
        value: role,
        label: this.getRoleLabel(role),
        description: this.getRoleDescription(role),
        level: this.getRoleLevel(role),
        group: this.getRoleGroup(role),
        config: this.getRoleConfig(role),
      }))
      .sort((a, b) => b.level - a.level);
  }

  /**
   * 获取分组的角色选项
   */
  static getGroupedRoleOptions() {
    const options = this.getRoleOptions();
    const grouped: Record<string, typeof options> = {};

    options.forEach((option) => {
      const group = option.group ?? 'OTHER';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(option);
    });

    return grouped;
  }

  /**
   * 检查用户是否有足够权限执行操作
   */
  static hasPermission(userRole: Role, requiredRole: Role): boolean {
    return this.getRoleLevel(userRole) >= this.getRoleLevel(requiredRole);
  }

  /**
   * 获取角色的权限范围描述
   */
  static getPermissionScope(role: Role): string {
    const level = this.getRoleLevel(role);

    if (level >= 80) return '全系统';
    if (level >= 50) return '组织/部门级';
    if (level >= 20) return '个人级';
    return '受限访问';
  }
}

/**
 * 角色装饰器工厂
 * 用于方法级别的角色权限控制
 */
export function RequireRole(minRole: Role) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // 这里可以添加权限检查逻辑
      // 实际实现需要结合具体的认证系统
      return originalMethod.apply(this, args);
    };

    // 存储元数据供其他装饰器或守卫使用
    Reflect.defineMetadata('minRole', minRole, target, propertyKey);
  };
}

/**
 * 导出常用的角色检查函数（向后兼容）
 */
export const isValidRole = RoleUtils.isValidRole;
export const getRoleLabel = RoleUtils.getRoleLabel;
export const getRoleLevel = RoleUtils.getRoleLevel;
export const getRoleDescription = RoleUtils.getRoleDescription;
export const compareRoles = RoleUtils.compareRoles;
export const canManageRole = RoleUtils.canManageRole;
export const parseRole = RoleUtils.parseRole;
export const getRoleOptions = RoleUtils.getRoleOptions;
export const getSubordinateRoles = RoleUtils.getManageableRoles;

/**
 * 默认导出角色枚举
 */
export default Role;
