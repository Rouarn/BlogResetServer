# 异常过滤

## 概述

- 全局异常过滤：`HttpExceptionFilter` 统一错误响应

## 导出

- `HttpExceptionFilter`

## 默认注册（AppModule）

```ts
providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }];
```

## 错误响应格式

- 统一 `code/message/data/success/timestamp/error/path/url`
