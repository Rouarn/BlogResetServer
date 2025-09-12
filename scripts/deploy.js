#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 部署脚本 - 准备生产环境部署文件
 */

const projectRoot = path.resolve(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');
const deployPath = path.join(projectRoot, 'deploy');

console.log('🚀 开始准备部署文件...');

// 检查 dist 目录是否存在
if (!fs.existsSync(distPath)) {
  console.error('❌ dist 目录不存在，请先运行 npm run build:prod');
  process.exit(1);
}

// 创建部署目录
if (fs.existsSync(deployPath)) {
  console.log('🧹 清理旧的部署目录...');
  fs.rmSync(deployPath, { recursive: true, force: true });
}

fs.mkdirSync(deployPath, { recursive: true });
console.log('📁 创建部署目录:', deployPath);

// 复制 dist 目录
console.log('📦 复制 dist 目录...');
execSync(`xcopy "${distPath}" "${path.join(deployPath, 'dist')}" /E /I /H /Y`, { stdio: 'inherit' });

// 动态生成生产环境 package.json
console.log('📄 生成生产环境 package.json...');
const originalPackageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));

// 创建生产环境 package.json
const productionPackageJson = {
  name: originalPackageJson.name,
  version: originalPackageJson.version,
  description: originalPackageJson.description,
  author: originalPackageJson.author,
  private: originalPackageJson.private,
  license: originalPackageJson.license,
  scripts: {
    start: 'cross-env NODE_ENV=production node dist/main.js',
    'start:simple': 'node dist/main.js'
  },
  dependencies: {
     // 从原始 package.json 复制所有生产依赖
     ...originalPackageJson.dependencies,
     // 确保包含一些可能在 devDependencies 中但生产环境需要的包
     ...(originalPackageJson.devDependencies?.cors && { cors: originalPackageJson.devDependencies.cors }),
     ...(originalPackageJson.devDependencies?.['cross-env'] && { 'cross-env': originalPackageJson.devDependencies['cross-env'] }),
     ...(originalPackageJson.devDependencies?.['@nestjs/swagger'] && { '@nestjs/swagger': originalPackageJson.devDependencies['@nestjs/swagger'] })
   },
  engines: originalPackageJson.engines
};

// 写入生产环境 package.json
const deployPackageJson = path.join(deployPath, 'package.json');
fs.writeFileSync(deployPackageJson, JSON.stringify(productionPackageJson, null, 2));

// 复制环境配置文件
const envFiles = ['.env.production', '.env'];
for (const envFile of envFiles) {
  const srcEnv = path.join(projectRoot, envFile);
  const destEnv = path.join(deployPath, envFile);
  
  if (fs.existsSync(srcEnv)) {
    console.log(`📄 复制环境文件: ${envFile}`);
    fs.copyFileSync(srcEnv, destEnv);
  }
}

// 创建启动脚本 (Windows)
const startScriptWin = `@echo off
echo 正在启动 NestJS 应用...
set NODE_ENV=production
node dist/main.js
pause
`;

fs.writeFileSync(path.join(deployPath, 'start.bat'), startScriptWin);
console.log('📄 创建Windows启动脚本: start.bat');

// 创建启动脚本 (Linux)
const startScriptLinux = `#!/bin/bash
echo "正在启动 NestJS 应用..."
export NODE_ENV=production
node dist/main.js
`;

fs.writeFileSync(path.join(deployPath, 'start.sh'), startScriptLinux);
fs.chmodSync(path.join(deployPath, 'start.sh'), '755');
console.log('📄 创建Linux启动脚本: start.sh');

// 创建安装依赖脚本 (Windows)
const installScriptWin = `@echo off
echo 正在安装生产依赖...
npm install --omit=dev
echo 依赖安装完成！
pause
`;

fs.writeFileSync(path.join(deployPath, 'install.bat'), installScriptWin);
console.log('📄 创建Windows安装脚本: install.bat');

// 创建安装依赖脚本 (Linux)
const installScriptLinux = `#!/bin/bash
echo "正在安装生产依赖..."
npm install --omit=dev
echo "依赖安装完成！"
`;

fs.writeFileSync(path.join(deployPath, 'install.sh'), installScriptLinux);
fs.chmodSync(path.join(deployPath, 'install.sh'), '755');
console.log('📄 创建Linux安装脚本: install.sh');

// 创建部署说明文件
const deployReadme = `# 部署说明

## 快速部署步骤

### Windows 服务器
1. 将此目录上传到服务器
2. 双击运行 \`install.bat\` 或在命令行运行: \`npm install --omit=dev\`
3. 配置环境变量（.env.production）
4. 双击运行 \`start.bat\` 或运行: \`npm start\`

### Linux 服务器
1. 将此目录上传到服务器
2. 运行安装脚本: \`chmod +x install.sh && ./install.sh\`
3. 或直接运行: \`npm install --omit=dev\`
4. 配置环境变量（.env.production）
5. 运行启动脚本: \`chmod +x start.sh && ./start.sh\`
6. 或直接运行: \`npm start\` 或 \`node dist/main.js\`

## 宝塔面板配置

- 项目路径: 上传目录的完整路径
- 启动文件: dist/main.js
- 运行目录: 项目根目录
- 启动方式: node dist/main.js
- 端口: 检查应用配置的端口（通常是3000）

## 重要依赖说明

本项目包含以下关键依赖：
- @nestjs/swagger: API文档生成（已自动包含）
- cors: 跨域支持
- cross-env: 环境变量支持

## 注意事项

- 确保 Node.js 版本 >= 22.18.0
- 确保数据库和 Redis 连接配置正确
- 确保防火墙开放应用端口
- Linux服务器请使用 .sh 脚本，Windows服务器使用 .bat 脚本
- 推荐使用 \`npm install --omit=dev\` 而不是 \`--production\`

## 故障排除

如果遇到 "Cannot find module" 错误：
1. 检查 package.json 中是否包含所需依赖
2. 重新运行 \`npm install --omit=dev\`
3. 确认 Node.js 版本兼容性
`;

fs.writeFileSync(path.join(deployPath, 'README.md'), deployReadme);
console.log('📄 创建部署说明: README.md');

console.log('\n✅ 部署文件准备完成！');
console.log(`📁 部署目录: ${deployPath}`);
console.log('\n📋 接下来的步骤:');
console.log('1. 将 deploy 目录上传到服务器');
console.log('2. 在服务器运行: npm install --production');
console.log('3. 配置环境变量并启动应用');
console.log('\n🎉 祝您部署顺利！');