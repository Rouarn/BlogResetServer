// 独立的健康检查服务
// 可以作为单独的进程运行，不入侵主应用代码

const express = require('express');
const http = require('http');

const app = express();
const PORT = process.env.HEALTH_CHECK_PORT || 3001;

// 检查主应用是否健康
function checkMainApp() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 404);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// 健康检查端点
app.get('/health', async (req, res) => {
  const isHealthy = await checkMainApp();
  
  if (isHealthy) {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  } else {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Main application is not responding'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Health check service running on port ${PORT}`);
});

module.exports = app;