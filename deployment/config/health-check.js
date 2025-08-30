/**
 * 简单健康检查脚本
 * 
 * 这是一个轻量级的健康检查脚本，用于快速验证应用是否正常运行。
 * 执行一次检查后立即退出，不启动持久服务。
 * 
 * 主要用途：
 * - Docker 容器健康检查 (HEALTHCHECK)
 * - CI/CD 部署后验证
 * - 脚本化健康检查
 * - 简单的监控脚本
 * 
 * 工作原理：
 * 1. 向应用的 /health 端点发送 HTTP GET 请求
 * 2. 检查响应状态码
 * 3. 根据结果返回退出码（0=成功，1=失败）
 * 
 * 使用方法：
 * - 直接运行：node health-check.js
 * - Docker 中：HEALTHCHECK CMD node health-check.js
 * - 脚本中：node health-check.js && echo "App is healthy"
 */

const http = require('http');

// HTTP 请求配置
const options = {
  hostname: 'localhost',  // 目标主机
  port: 3000,            // 应用端口（固定 3000）
  path: '/health',       // 健康检查端点
  method: 'GET',         // HTTP 方法
  timeout: 3000          // 请求超时时间（3秒）
};

// 创建 HTTP 请求
const req = http.request(options, (res) => {
  // 检查响应状态码
  if (res.statusCode === 200) {
    // 健康检查通过，退出码 0 表示成功
    process.exit(0);
  } else {
    // 健康检查失败，退出码 1 表示失败
    process.exit(1);
  }
});

// 处理请求错误（网络错误、连接失败等）
req.on('error', () => {
  // 发生错误，退出码 1 表示失败
  process.exit(1);
});

// 处理请求超时
req.on('timeout', () => {
  req.destroy();    // 销毁请求连接
  process.exit(1);  // 退出码 1 表示失败
});

// 发送请求
req.end();