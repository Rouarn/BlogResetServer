# 异常过滤

## 概述

- 全局异常过滤：`HttpExceptionFilter` 统一错误响应

## 导出

- `HttpExceptionFilter`

## 默认注册（AppModule）

```ts
providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }];
```

## 在 main.ts 中注册

```ts
import { HttpExceptionFilter } from './common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3000);
}
bootstrap();
```

## 错误响应格式

- 统一 `code/message/data/success/timestamp/error/path/url`
