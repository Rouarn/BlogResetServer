/**
 * 独立健康检查服务
 * 
 * 这是一个独立运行的健康检查服务，用于监控主应用的运行状态。
 * 与主应用分离运行，避免对主应用代码的入侵。
 * 
 * 主要用途：
 * - Docker 容器健康检查
 * - 负载均衡器健康探测
 * - 监控系统状态检查
 * - 微服务架构中的服务发现
 * 
 * 工作原理：
 * 1. 启动独立的 Express 服务器（默认端口 3001）
 * 2. 提供 /health 端点供外部调用
 * 3. 内部向主应用发送 HTTP 请求检查状态
 * 4. 返回详细的健康状态信息
 * 
 * 使用方法：
 * - 启动服务：node standalone-health.js
 * - 检查健康：curl http://localhost:3001/health
 * - Docker 中：HEALTHCHECK CMD curl -f http://localhost:3001/health
 */

// 独立的健康检查服务
// 可以作为单独的进程运行，不入侵主应用代码

const express = require('express');
const http = require('http');

const app = express();
// 健康检查服务端口，默认 3001，可通过环境变量配置
const PORT = process.env.HEALTH_CHECK_PORT || 3001;

/**
 * 检查主应用是否健康
 * 
 * 通过向主应用发送 HTTP 请求来检测其运行状态
 * 
 * @returns {Promise<boolean>} 返回主应用是否健康的布尔值
 */
function checkMainApp() {
  return new Promise((resolve) => {
    // HTTP 请求配置
    const options = {
      hostname: 'localhost',  // 主应用主机名
      port: 3000,            // 主应用端口
      path: '/',             // 检查路径
      method: 'GET',         // HTTP 方法
      timeout: 3000          // 超时时间 3 秒
    };

    // 发送 HTTP 请求
    const req = http.request(options, (res) => {
      // 状态码 200 或 404 都认为是健康的
      // 404 表示服务运行但路由不存在，这也是正常状态
      resolve(res.statusCode === 200 || res.statusCode === 404);
    });

    // 处理请求错误（连接失败、网络错误等）
    req.on('error', () => resolve(false));
    
    // 处理请求超时
    req.on('timeout', () => {
      req.destroy();  // 销毁请求
      resolve(false); // 返回不健康状态
    });

    req.end();
  });
}

/**
 * 健康检查端点
 * 
 * GET /health
 * 
 * 响应格式：
 * - 健康时：200 状态码 + 详细信息
 * - 不健康时：503 状态码 + 错误信息
 */
app.get('/health', async (req, res) => {
  // 检查主应用健康状态
  const isHealthy = await checkMainApp();
  
  if (isHealthy) {
    // 主应用健康，返回详细状态信息
    res.status(200).json({
      status: 'ok',                                    // 状态：正常
      timestamp: new Date().toISOString(),            // 检查时间戳
      uptime: process.uptime(),                       // 健康检查服务运行时间
      environment: process.env.NODE_ENV || 'development', // 运行环境
    });
  } else {
    // 主应用不健康，返回错误信息
    res.status(503).json({
      status: 'error',                     // 状态：错误
      timestamp: new Date().toISOString(), // 检查时间戳
      message: 'Main application is not responding' // 错误描述
    });
  }
});

// 启动健康检查服务
app.listen(PORT, () => {
  console.log(`Health check service running on port ${PORT}`);
});

// 导出应用实例，便于测试
module.exports = app;