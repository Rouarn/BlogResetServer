# 验证码API文档

## 概述

本项目使用无状态JWT验证码机制，完全移除了Session和Cookie依赖，实现现代化的RESTful API设计。

## API接口

### 1. 获取验证码

**接口**: `GET /auth/captcha`

**描述**: 生成验证码图片和对应的JWT token

**请求头**:
```
Content-Type: application/json
User-Agent: <客户端标识>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "image": "<SVG验证码图片>",
    "token": "<JWT验证码token>",
    "expiresIn": 300,
    "nonce": "<随机标识符>"
  },
  "message": "验证码生成成功",
  "timestamp": "2025-08-29T07:00:00.000Z"
}
```

### 2. 验证验证码

**接口**: `POST /auth/captcha/verify`

**描述**: 验证用户输入的验证码

**请求体**:
```json
{
  "token": "<验证码JWT token>",
  "code": "<用户输入的验证码>"
}
```

**响应**:
```json
{
  "success": true,
  "message": "验证码验证成功",
  "timestamp": "2025-08-29T07:00:00.000Z"
}
```

### 3. 创建用户（需验证码）

**接口**: `POST /auth/create`

**描述**: 创建用户，需要先验证验证码

**请求体**:
```json
{
  "captchaToken": "<验证码JWT token>",
  "captchaCode": "<用户输入的验证码>",
  "username": "用户名",
  "email": "邮箱",
  "...": "其他用户数据"
}
```

**响应**:
```json
{
  "success": true,
  "message": "用户创建成功",
  "data": { "...": "用户数据" },
  "timestamp": "2025-08-29T07:00:00.000Z"
}
```

## 安全特性

### 1. 无状态设计
- 使用JWT token存储验证码信息
- 无需服务端状态管理
- 支持水平扩展和集群部署

### 2. 防爬机制
- 随机验证码复杂度（4-5位）
- 随机干扰线条和背景色
- 客户端信息验证（IP + User-Agent）
- 防重放攻击（nonce机制）

### 3. 时间控制
- 验证码5分钟自动过期
- JWT token自动失效
- 时间窗口验证

### 4. 错误处理
- 详细的错误原因返回
- 统一的响应格式
- 安全的错误信息

## 前端集成示例

### JavaScript/TypeScript

```typescript
class CaptchaService {
  private baseUrl = '/auth';

  // 获取验证码
  async getCaptcha(): Promise<CaptchaResponse> {
    const response = await fetch(`${this.baseUrl}/captcha`);
    return response.json();
  }

  // 验证验证码
  async verifyCaptcha(token: string, code: string): Promise<VerifyResponse> {
    const response = await fetch(`${this.baseUrl}/captcha/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, code })
    });
    return response.json();
  }

  // 创建用户
  async createUser(captchaToken: string, captchaCode: string, userData: any) {
    const response = await fetch(`${this.baseUrl}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        captchaToken,
        captchaCode,
        ...userData
      })
    });
    return response.json();
  }
}
```

### React Hook示例

```typescript
import { useState, useCallback } from 'react';

export const useCaptcha = () => {
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCaptcha = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/auth/captcha');
      const data = await response.json();
      if (data.success) {
        setCaptcha(data.data);
      }
    } catch (error) {
      console.error('获取验证码失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyCaptcha = useCallback(async (code: string) => {
    if (!captcha?.token) return false;
    
    try {
      const response = await fetch('/auth/captcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: captcha.token,
          code
        })
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('验证码验证失败:', error);
      return false;
    }
  }, [captcha]);

  return {
    captcha,
    loading,
    refreshCaptcha,
    verifyCaptcha
  };
};
```

## 最佳实践

### 1. 客户端缓存
- 验证码token应在客户端安全存储
- 避免重复请求验证码
- 及时清理过期token

### 2. 错误处理
- 实现重试机制
- 友好的错误提示
- 自动刷新验证码

### 3. 安全考虑
- 不在URL中传递敏感信息
- 使用HTTPS传输
- 实现请求频率限制

### 4. 用户体验
- 提供验证码刷新功能
- 支持键盘操作
- 无障碍访问支持

## 迁移指南

### 从Session到JWT

1. **前端改动**:
   - 移除Cookie依赖
   - 使用token进行验证码验证
   - 更新API调用方式

2. **后端改动**:
   - 已完全移除Session机制
   - 使用JWT存储验证码信息
   - 实现无状态验证

3. **部署考虑**:
   - 无需Session存储配置
   - 支持多实例部署
   - 简化负载均衡配置