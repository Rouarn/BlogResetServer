#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { log, showBanner, separator, showSuccess, handleError } = require('@vakao-ui/scripts-utils');

/**
 * 环境变量设置工具
 * 用于快速创建和配置环境文件
 * 适配pnpm项目
 */

// 统一使用脚本工具库的日志与样式

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
  common: {
    NEST_APP_TITLE: 'NestJS Template',
    NEST_JWT_ACCESS_TOKEN_TTL: 3600,
    NEST_JWT_REFRESH_TOKEN_TTL: 604800,
    NEST_SWAGGER_PREFIX: '/api-docs',
    API_PREFIX: 'api',
    API_DEFAULT_VERSION: 1,
  },
  development: {
    NODE_ENV: 'development',
    NEST_PORT: '8898',
    NEST_BASE_URL: 'http://localhost:8898',
    NEST_JWT_SECRET: '',
    NEST_DATABASE_HOST: '127.0.0.1',
    NEST_DATABASE_PORT: '3306',
    NEST_DATABASE_USER: 'root',
    NEST_DATABASE_PASSWORD: '',
    NEST_DATABASE_NAME: 'nestjs_dev',
    NEST_DATABASE_LOGGING: 'false',
    NEST_DATABASE_SYNCHRONIZE: 'true',
    NEST_STATIC_ASSETS_MAXAGE: 0,
    NEST_CORS_ORIGINS:
      'http://localhost:8848,http://127.0.0.1:8848,http://localhost:8849,http://127.0.0.1:8849,http://localhost:8898,http://127.0.0.1:8898',
    NEST_LOG_LEVEL: 'debug',
    NEST_STATIC_ASSETS_DIR: './static',
    NEST_STATIC_ASSETS_PREFIX: '/static',
    NEST_STATIC_UPLOAD_PATH: './dist/static/uploads',
    NEST_UPLOAD_MAX_SIZE: 10485760,
    NEST_UPLOAD_ALLOWED_TYPES: 'image/jpeg,image/png,image/gif,application/pdf',
    NEST_UPLOAD_MAX_FILES: 10,
    NEST_REDIS_ENABLED: 'true',
    NEST_REDIS_HOST: '127.0.0.1',
    NEST_REDIS_PORT: 6379,
    NEST_REDIS_PASSWORD: '',
    NEST_REDIS_DB: 0,
    NEST_REDIS_CONNECT_TIMEOUT: 10000,
    NEST_REDIS_COMMAND_TIMEOUT: 5000,
    NEST_REDIS_RETRIES: 3,
    NEST_REDIS_RETRY_DELAY: 1000,
    NEST_REDIS_MAX_CONNECTIONS: 10,
    NEST_REDIS_MIN_CONNECTIONS: 2,
    NEST_REDIS_IDLE_TIMEOUT: 30000,
    NEST_REDIS_KEY_PREFIX: 'nestjs:dev:',
    NEST_REDIS_DEFAULT_TTL: 3600,
  },
  production: {
    NODE_ENV: 'production',
    NEST_PORT: '8848',
    NEST_BASE_URL: 'http://localhost:8848',
    NEST_JWT_SECRET: '',
    NEST_DATABASE_HOST: '127.0.0.1',
    NEST_DATABASE_PORT: 13306,
    NEST_DATABASE_USER: 'prod_user',
    NEST_DATABASE_PASSWORD: '',
    NEST_DATABASE_NAME: 'nestjs_prod',
    NEST_DATABASE_LOGGING: 'false',
    NEST_DATABASE_SYNCHRONIZE: 'false',
    NEST_CORS_ORIGINS: '*',
    NEST_LOG_LEVEL: 'error',
    NEST_STATIC_ASSETS_DIR: './static',
    NEST_STATIC_ASSETS_PREFIX: '/static',
    NEST_STATIC_ASSETS_MAXAGE: 86400,
    NEST_UPLOAD_PATH: './static/uploads',
    NEST_UPLOAD_MAX_SIZE: 10485760,
    NEST_UPLOAD_ALLOWED_TYPES: 'image/jpeg,image/png,image/gif,application/pdf',
    NEST_REDIS_ENABLED: 'true',
    NEST_REDIS_HOST: '127.0.0.1',
    NEST_REDIS_PORT: 16379,
    NEST_REDIS_PASSWORD: '',
    NEST_REDIS_DB: 0,
    NEST_REDIS_CONNECT_TIMEOUT: 5000,
    NEST_REDIS_COMMAND_TIMEOUT: 3000,
    NEST_REDIS_RETRIES: 5,
    NEST_REDIS_RETRY_DELAY: 2000,
    NEST_REDIS_MAX_CONNECTIONS: 50,
    NEST_REDIS_MIN_CONNECTIONS: 10,
    NEST_REDIS_IDLE_TIMEOUT: 60000,
    NEST_REDIS_KEY_PREFIX: 'nestjs:prod:',
    NEST_REDIS_DEFAULT_TTL: 7200,
  },
  test: {
    NODE_ENV: 'test',
    NEST_PORT: '8898',
    NEST_BASE_URL: 'http://localhost:8898',
    NEST_JWT_SECRET: '',
    NEST_DATABASE_HOST: '127.0.0.1',
    NEST_DATABASE_PORT: 3306,
    NEST_DATABASE_USER: 'root',
    NEST_DATABASE_PASSWORD: '',
    NEST_DATABASE_NAME: 'nestjs_test',
    NEST_DATABASE_LOGGING: 'false',
    NEST_DATABASE_SYNCHRONIZE: 'true',
    NEST_STATIC_ASSETS_MAXAGE: 0,
    NEST_CORS_ORIGINS: 'http://localhost:8849,http://localhost:3000,http://localhost:8898',
    NEST_LOG_LEVEL: 'debug',
    NEST_STATIC_ASSETS_DIR: './dist/static',
    NEST_STATIC_ASSETS_PREFIX: '/static',
    NEST_STATIC_ASSETS_MAXAGE_TEST: 0,
    NEST_STATIC_UPLOAD_PATH: './dist/static/uploads',
    NEST_UPLOAD_MAX_SIZE: 10485760,
    NEST_UPLOAD_ALLOWED_TYPES: 'image/jpeg,image/png,image/gif,application/pdf',
    NEST_UPLOAD_MAX_FILES: 10,
    NEST_REDIS_ENABLED: 'true',
    NEST_REDIS_HOST: '127.0.0.1',
    NEST_REDIS_PORT: 6379,
    NEST_REDIS_PASSWORD: '',
    NEST_REDIS_DB: 0,
    NEST_REDIS_CONNECT_TIMEOUT: 10000,
    NEST_REDIS_COMMAND_TIMEOUT: 5000,
    NEST_REDIS_RETRIES: 3,
    NEST_REDIS_RETRY_DELAY: 1000,
    NEST_REDIS_MAX_CONNECTIONS: 10,
    NEST_REDIS_MIN_CONNECTIONS: 2,
    NEST_REDIS_IDLE_TIMEOUT: 30000,
    NEST_REDIS_KEY_PREFIX: 'nestjs:test:',
    NEST_REDIS_DEFAULT_TTL: 3600,
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
  showBanner('NestJS 环境配置向导 (PNPM)');
  separator('─', 50);

  const rootDir = path.resolve(__dirname, '..');

  // 检查现有文件
  const envFiles = ['.env', '.env.development', '.env.production', '.env.test'];

  log('\n📁 检查现有环境文件:', 'check');
  const existingFiles = [];
  envFiles.forEach((file) => {
    const filePath = path.join(rootDir, file);
    const exists = fs.existsSync(filePath);
    if (exists) {
      existingFiles.push(file);
      log(`  ⚠️  ${file} 已存在`, 'warning');
    } else {
      log(`  ✅ ${file} 不存在，可以创建`, 'success');
    }
  });

  if (existingFiles.length > 0) {
    const overwrite = await question('\n是否覆盖现有文件? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      log('❌ 操作已取消', 'error');
      rl.close();
      return;
    }
  }

  log('\n🔧 配置环境变量:', 'check');

  log('\n📝 公共配置:', 'info');
  const commonConfig = { ...envTemplates.common };

  log('\n📝 开发环境配置:', 'info');
  const devConfig = { ...envTemplates.development };
  const devPort = await question(`开发端口 (默认: ${devConfig.NEST_PORT}): `);
  if (devPort) devConfig.NEST_PORT = devPort;
  const devBase = await question(`开发基址 (默认: ${devConfig.NEST_BASE_URL}): `);
  if (devBase) devConfig.NEST_BASE_URL = devBase;
  const devDbPassword = await question(`开发数据库密码 (默认: 空): `);
  if (devDbPassword) devConfig.NEST_DATABASE_PASSWORD = devDbPassword;
  const devDbName = await question(`开发数据库名称 (默认: ${devConfig.NEST_DATABASE_NAME}): `);
  if (devDbName) devConfig.NEST_DATABASE_NAME = devDbName;
  devConfig.NEST_JWT_SECRET = generateRandomSecret();
  log(`  🔑 开发JWT密钥: ${devConfig.NEST_JWT_SECRET.substring(0, 8)}...`, 'success');

  log('\n📝 生产环境配置:', 'cyan');
  const prodConfig = { ...envTemplates.production };
  const prodPort = await question(`生产端口 (默认: ${prodConfig.NEST_PORT}): `);
  if (prodPort) prodConfig.NEST_PORT = prodPort;
  const prodBase = await question(`生产基址 (默认: ${prodConfig.NEST_BASE_URL}): `);
  if (prodBase) prodConfig.NEST_BASE_URL = prodBase;
  const prodDbPassword = await question(`生产数据库密码: `);
  if (prodDbPassword) prodConfig.NEST_DATABASE_PASSWORD = prodDbPassword;
  const prodDbName = await question(`生产数据库名称 (默认: ${prodConfig.NEST_DATABASE_NAME}): `);
  if (prodDbName) prodConfig.NEST_DATABASE_NAME = prodDbName;
  prodConfig.NEST_JWT_SECRET = generateRandomSecret(48);
  log(`  🔑 生产JWT密钥: ${prodConfig.NEST_JWT_SECRET.substring(0, 8)}...`, 'success');

  log('\n📝 测试环境配置:', 'cyan');
  const testConfig = { ...envTemplates.test };
  const testPort = await question(`测试端口 (默认: ${testConfig.NEST_PORT}): `);
  if (testPort) testConfig.NEST_PORT = testPort;
  const testBase = await question(`测试基址 (默认: ${testConfig.NEST_BASE_URL}): `);
  if (testBase) testConfig.NEST_BASE_URL = testBase;
  const testDbPassword = await question(`测试数据库密码 (默认: 空): `);
  if (testDbPassword) testConfig.NEST_DATABASE_PASSWORD = testDbPassword;
  const testDbName = await question(`测试数据库名称 (默认: ${testConfig.NEST_DATABASE_NAME}): `);
  if (testDbName) testConfig.NEST_DATABASE_NAME = testDbName;
  testConfig.NEST_JWT_SECRET = generateRandomSecret();
  log(`  🔑 测试JWT密钥: ${testConfig.NEST_JWT_SECRET.substring(0, 8)}...`, 'success');

  // 创建文件
  log('\n📄 创建环境文件:', 'build');

  createEnvFile(path.join(rootDir, '.env'), commonConfig);
  createEnvFile(path.join(rootDir, '.env.development'), devConfig);
  createEnvFile(path.join(rootDir, '.env.production'), prodConfig);
  createEnvFile(path.join(rootDir, '.env.test'), testConfig);

  showSuccess('\n🎉 环境配置完成！');
  separator('─', 50);
  log('📋 下一步操作 (PNPM):', 'check');
  log('  1. 运行 pnpm run env:check 检查配置', 'check');
  log('  2. 运行 pnpm run start:dev 启动开发服务器', 'check');
  log('  3. 确保数据库服务已启动', 'check');
  log('  4. 如需安装依赖: pnpm install', 'check');

  rl.close();
}

if (require.main === module) {
  setupEnvironment().catch((err) => handleError('环境配置脚本执行失败', err));
}

module.exports = { setupEnvironment };
