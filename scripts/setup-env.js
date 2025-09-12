#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * 环境变量设置工具
 * 用于快速创建和配置环境文件
 * 适配pnpm项目
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

const envTemplates = {
  development: {
    NEST_PORT: '8848',
    NEST_DATABASE_HOST: 'localhost',
    NEST_DATABASE_PORT: '3306',
    NEST_DATABASE_USER: 'root',
    NEST_DATABASE_PASSWORD: '',
    NEST_DATABASE_NAME: 'nestjs_dev',
    NEST_DATABASE_SYNCHRONIZE: 'true',
    NEST_DATABASE_LOGGING: 'false',
  },
  production: {
    NEST_PORT: '3000',
    NEST_DATABASE_HOST: 'localhost',
    NEST_DATABASE_PORT: '3306',
    NEST_DATABASE_USER: 'prod_user',
    NEST_DATABASE_PASSWORD: '',
    NEST_DATABASE_NAME: 'nestjs_prod',
    NEST_DATABASE_SYNCHRONIZE: 'false',
    NEST_DATABASE_LOGGING: 'false',
  },
  common: {
    NEST_JWT_SECRET: '',
    NEST_JWT_EXPIRES_IN: '7d',
  },
};

function generateRandomSecret(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createEnvFile(filePath, config) {
  const content = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(filePath, content + '\n');
  log(`✅ 已创建: ${path.basename(filePath)}`, 'green');
}

async function setupEnvironment() {
  log('🚀 NestJS 环境配置向导 (PNPM项目)', 'cyan');
  log('='.repeat(50), 'blue');

  const rootDir = path.resolve(__dirname, '..');

  // 检查现有文件
  const envFiles = ['.env', '.env.development', '.env.production'];

  log('\n📁 检查现有环境文件:', 'yellow');
  const existingFiles = [];
  envFiles.forEach((file) => {
    const filePath = path.join(rootDir, file);
    const exists = fs.existsSync(filePath);
    if (exists) {
      existingFiles.push(file);
      log(`  ⚠️  ${file} 已存在`, 'yellow');
    } else {
      log(`  ✅ ${file} 不存在，可以创建`, 'green');
    }
  });

  if (existingFiles.length > 0) {
    const overwrite = await question('\n是否覆盖现有文件? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      log('❌ 操作已取消', 'red');
      rl.close();
      return;
    }
  }

  log('\n🔧 配置环境变量:', 'yellow');

  // 配置开发环境
  log('\n📝 开发环境配置:', 'cyan');
  const devConfig = { ...envTemplates.development };

  const dbPassword = await question(`数据库密码 (默认: 空): `);
  if (dbPassword) devConfig.NEST_DATABASE_PASSWORD = dbPassword;

  const dbName = await question(`数据库名称 (默认: ${devConfig.NEST_DATABASE_NAME}): `);
  if (dbName) devConfig.NEST_DATABASE_NAME = dbName;

  // 配置生产环境
  log('\n📝 生产环境配置:', 'cyan');
  const prodConfig = { ...envTemplates.production };

  const prodDbPassword = await question(`生产数据库密码: `);
  prodConfig.NEST_DATABASE_PASSWORD = prodDbPassword;

  const prodDbName = await question(`生产数据库名称 (默认: ${prodConfig.NEST_DATABASE_NAME}): `);
  if (prodDbName) prodConfig.NEST_DATABASE_NAME = prodDbName;

  // 配置公共变量
  log('\n📝 公共配置:', 'cyan');
  const commonConfig = { ...envTemplates.common };

  const useRandomSecret = await question(`使用随机生成的JWT密钥? (Y/n): `);
  if (useRandomSecret.toLowerCase() !== 'n') {
    commonConfig.NEST_JWT_SECRET = generateRandomSecret();
    log(`  🔑 已生成JWT密钥: ${commonConfig.NEST_JWT_SECRET.substring(0, 8)}...`, 'green');
  } else {
    const jwtSecret = await question(`请输入JWT密钥: `);
    commonConfig.NEST_JWT_SECRET = jwtSecret;
  }

  // 创建文件
  log('\n📄 创建环境文件:', 'yellow');

  createEnvFile(path.join(rootDir, '.env'), commonConfig);
  createEnvFile(path.join(rootDir, '.env.development'), devConfig);
  createEnvFile(path.join(rootDir, '.env.production'), prodConfig);



  log('\n🎉 环境配置完成！', 'green');
  log('\n📋 下一步操作 (PNPM):', 'cyan');
  log('  1. 运行 pnpm run env:check 检查配置', 'white');
  log('  2. 运行 pnpm run start:dev 启动开发服务器', 'white');
  log('  3. 确保数据库服务已启动', 'white');
  log('  4. 如需安装依赖: pnpm install', 'white');

  rl.close();
}

if (require.main === module) {
  setupEnvironment().catch(console.error);
}

module.exports = { setupEnvironment };
