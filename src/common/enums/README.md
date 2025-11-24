# 枚举模块（`src/common/enums`）

提供系统常用枚举与配套工具函数，统一业务语义、避免魔法值、提升类型安全与可读性。通过集中导出入口 `index.ts` 在各处复用。

## 快速使用

- 推荐从集中入口导入：

```ts
import { Gender, Role, Status, getGenderLabel, RoleUtils, getStatusLabel } from '@/common/enums';
```

- 典型场景：

```ts
// 校验与显示
function renderUser(u: { gender: Gender; role: Role; status: Status }) {
  return {
    genderText: getGenderLabel(u.gender),
    roleText: RoleUtils.getRoleLabel(u.role),
    statusText: getStatusLabel(u.status),
    canManage: RoleUtils.canManageRole(Role.SYSTEM_ADMIN, u.role),
    enabled: u.status === Status.ENABLED,
  };
}

// 解析字符串到枚举
const parsedGender = parseGender('female');
const parsedRole = RoleUtils.parseRole('admin');
const parsedStatus = parseStatus('1');
```

## 导出入口（`index.ts`）

- 统一导出所有枚举及工具：
  - `export * from './gender.enum'`
  - `export * from './role.enum'`
  - `export * from './status.enum'`
- 使用路径别名 `@/common/enums` 进行一次性导入，减少分散引用。

## 性别枚举（`gender.enum.ts`）

- 枚举：`Gender`（`MALE=0`, `FEMALE=1`, `UNKNOWN=2`）
- 常量与类型：
  - `GENDER_VALUES`: 所有枚举数值列表
  - `GenderType`: 类型别名
  - `GENDER_LABELS`: 显示标签映射（男/女/未知）
  - `GENDER_KEYS`: 键名映射（MALE/FEMALE/UNKNOWN）
- 工具函数：
  - `isValidGender(value): value is Gender`
  - `getGenderLabel(gender): string`
  - `getGenderKey(gender): keyof typeof Gender`
  - `parseGender(genderStr): Gender`（支持英文/中文/别名）
  - `getGenderOptions(): { value, label, key }[]`

## 状态枚举（`status.enum.ts`）

- 枚举：`Status`（`DISABLED=0`, `ENABLED=1`）
- 常量与类型：
  - `STATUS_VALUES`: 所有枚举数值列表
  - `StatusType`: 类型别名
  - `STATUS_LABELS`: 显示标签映射（禁用/启用）
  - `STATUS_KEYS`: 键名映射（DISABLED/ENABLED）
  - `STATUS_DESCRIPTIONS`: 状态描述文案
- 工具函数：
  - `isValidStatus(value): value is Status`
  - `getStatusLabel(status): string`
  - `getStatusKey(status): keyof typeof Status`
  - `getStatusDescription(status): string`
  - `parseStatus(statusStr): Status`（支持键名/数字/标签）
  - `getStatusOptions(): { value, label, key, description }[]`
  - `toggleStatus(status): Status`（启用↔禁用）
  - `isEnabled(status): boolean` / `isDisabled(status): boolean`

## 角色枚举（`role.enum.ts`）

- 枚举：`Role`（字符串枚举，如 `system_admin`、`org_admin`、`user` 等）
- 配置与分组：
  - `ROLE_HIERARCHY`: 权限等级（数值越大权限越高）
  - `ROLE_CONFIG`: 显示信息（`label/description/color/icon`）
  - `ROLE_GROUPS`: 角色分组（`ADMIN/BUSINESS/READONLY`）
- 工具类：`RoleUtils`
  - 校验与显示：`isValidRole`、`getRoleLabel`、`getRoleDescription`、`getRoleConfig`
  - 权限等级与比较：`getRoleLevel`、`compareRoles`、`canManageRole`
  - 归属与分组：`isAdminRole`、`isBusinessRole`、`isReadOnlyRole`、`getRoleGroup`
  - 上下级关系：`getManageableRoles`（可管理的下级）、`getSuperiorRoles`（上级）
  - 解析与选项：`parseRole`、`getRoleOptions`（列表）、`getGroupedRoleOptions`（分组）
  - 权限判断：`hasPermission(userRole, requiredRole)`、`getPermissionScope`
- 便捷导出：
  - 直接导出常用函数以兼容旧代码（如 `getRoleLabel` 等）
  - 默认导出：`export default Role`

## 最佳实践

- 统一从 `@/common/enums` 导入，避免到处引用具体文件路径。
- 业务层不要硬编码魔法值，使用枚举与工具函数保证类型安全与可读性。
- 表单/下拉框使用 `get*Options()` 生成选项，实现展示与值的统一来源。
- 权限判断统一走 `RoleUtils`，避免在业务代码中散落数字比较或字符串判断。
- 对外接口或存储时，优先保存枚举值（数字或字符串），显示层使用工具函数渲染标签。

## 代码片段示例

```ts
import { Role, RoleUtils, Status, getStatusOptions, Gender, getGenderOptions } from '@/common/enums';

// 生成表单选项
const genderOptions = getGenderOptions();
const statusOptions = getStatusOptions();
const roleOptions = RoleUtils.getRoleOptions();

// 权限控制
const canEdit = RoleUtils.hasPermission(Role.ORG_ADMIN, Role.USER);
const manageable = RoleUtils.getManageableRoles(Role.DEPT_ADMIN); // 下级角色列表

// 状态切换
const nextStatus = toggleStatus(Status.ENABLED);

// 参数解析
const role = RoleUtils.parseRole('administrator') ?? Role.USER;
const gender = parseGender('男');
const status = parseStatus('ENABLED');
```

## 目录结构

```
src/common/enums/
  ├─ gender.enum.ts   # 性别枚举与工具
  ├─ role.enum.ts     # 角色枚举、层级、分组与工具类
  ├─ status.enum.ts   # 状态枚举与工具
  └─ index.ts         # 集中导出入口
```

---
如需增加新的枚举类型，建议参考现有文件的结构与工具函数设计，保持统一的使用体验与类型签名。
