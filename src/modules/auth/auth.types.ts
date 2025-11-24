/**
 * 认证用户信息返回类型
 *
 * 用于统一描述从认证模块返回的用户信息结构，避免在控制器与服务中重复定义。
 * 该类型仅包含非敏感字段，适合直接返回给客户端或在业务层传递。
 */
export interface AuthUserInfo {
  /** 用户ID（优先使用用户表ID，缺失时使用认证ID） */
  userId: string;
  /** 用户名（认证账号用户名） */
  username: string;
  /** 昵称（无用户资料时回退为用户名） */
  nickname: string;
  /** 头像URL（可能为空字符串） */
  avatar: string;
  /** 角色标识（如 ADMIN、USER 等） */
  roles: string;
  /** 邮箱地址（可能为空字符串） */
  email: string;
  /** 性别展示标签（来自枚举映射，可能为空字符串） */
  gender: string;
  /** 手机号（可能为空字符串） */
  mobile: string;
  /** 个人简介（可能为空字符串） */
  bio: string;
  /** 生日（可能为 undefined） */
  birthday: Date | undefined;
  /** 所在城市（可能为空字符串） */
  city: string;
  /** 职业（可能为空字符串） */
  profession: string;
  /** 认证记录ID */
  authId: string;
  /** 最近一次登录时间 */
  lastLoginAt: Date;
  /** 最近一次登录IP（可能为空字符串） */
  lastLoginIp: string;
}

/**
 * 认证验证码响应类型
 *
 * 用于描述从认证模块获取验证码的响应结构，包含验证码图片、token 等信息。
 */
export interface AuthCaptchaResponse {
  image: string;
  token: string;
  expiresIn: number;
  nonce: string;
}

/**
 * 认证验证码校验请求类型
 *
 * 用于描述向认证模块校验验证码的请求结构，包含 token 和验证码值。
 */
export interface AuthCaptchaVerifyRequest {
  token: string;
  code: string;
}

/**
 * 认证验证码校验响应类型
 *
 * 用于描述向认证模块校验验证码的响应结构，包含校验结果、消息和可选的时间戳。
 */
export interface AuthCaptchaVerifyResponse {
  message: string;
}

/**
 * 认证创建用户记录类型
 *
 * 用于描述认证模块创建用户时返回的记录结构，包含用户ID和用户名。
 */
export interface AuthCreateUserRecord {
  id: string;
  username: string;
}

/**
 * 认证创建用户响应类型
 *
 * 用于描述认证模块创建用户的响应结构，包含成功状态、消息和可选的用户记录。
 */
export interface AuthCreateUserResponse {
  success: boolean;
  message: string;
  record?: AuthCreateUserRecord;
}

/**
 * 认证消息响应类型
 *
 * 用于描述认证模块返回的消息响应结构，包含消息内容。
 */
export interface AuthMessageResponse {
  message: string;
}
