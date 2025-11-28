#!/usr/bin/env node

/**
 * NestJS 环境配置检查工具
 *
 * 功能说明：
 * - 检查项目环境配置文件的存在性和完整性
 * - 验证必需环境变量是否正确设置
 * - 分析环境变量冲突和一致性问题
 * - 提供彩色输出和详细的检查报告
 *
 * 支持的环境文件：
 * - .env (可选，通用环境变量)
 * - .env.development (必需，开发环境配置)
 * - .env.production (可选，生产环境配置)
 *
 * 使用方法：
 * - 直接运行：node scripts/check-env.js
 * - npm 脚本：npm run check:env
 * - 在其他脚本中引用：require('./scripts/check-env')
 *
 * 检查项目：
 * 1. 环境文件存在性检查
 * 2. 必需环境变量完整性验证
 * 3. 变量冲突检测
 * 4. 端口配置分析
 * 5. 安全性检查（密码/密钥脱敏显示）
 */

const fs = require('fs');
const path = require('path');
const { log, showBanner, separator, showSuccess, handleError } = require('@vakao-ui/scripts-utils');

// 使用统一日志库替代自定义颜色输出

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function loadEnvFile(filePath) {
  if (!checkFileExists(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  content.split('\n').forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

function main() {
  showBanner('NestJS 环境配置检查工具');
  separator('─', 50);

  const rootDir = path.resolve(__dirname, '..');
  const envFiles = [
    { name: '.env', path: path.join(rootDir, '.env'), required: true },
    { name: '.env.development', path: path.join(rootDir, '.env.development'), required: true },
    { name: '.env.production', path: path.join(rootDir, '.env.production'), required: true },
    { name: '.env.test', path: path.join(rootDir, '.env.test'), required: true },
  ];

  // 检查环境文件存在性
  log('\n📁 环境文件检查:', 'check');
  let allFilesOk = true;

  envFiles.forEach((file) => {
    const exists = checkFileExists(file.path);
    const status = exists ? '✅' : file.required ? '❌' : '⚠️';
    const type = exists ? 'success' : file.required ? 'error' : 'warning';
    log(`  ${status} ${file.name}`, type);

    if (file.required && !exists) {
      allFilesOk = false;
    }
  });

  // 加载并分析环境变量
  log('\n🔧 环境变量分析:', 'check');

  const envData = {};
  envFiles.forEach((file) => {
    const data = loadEnvFile(file.path);
    if (data) {
      envData[file.name] = data;
    }
  });

  // 检查必需的环境变量
  const commonRequired = [
    'NEST_JWT_ACCESS_TOKEN_TTL',
    'NEST_JWT_REFRESH_TOKEN_TTL',
    'NEST_SWAGGER_PREFIX',
    'API_PREFIX',
    'API_DEFAULT_VERSION',
  ];
  const devRequired = [
    'NODE_ENV',
    'NEST_PORT',
    'NEST_BASE_URL',
    'NEST_JWT_SECRET',
    'NEST_DATABASE_HOST',
    'NEST_DATABASE_PORT',
    'NEST_DATABASE_USER',
    'NEST_DATABASE_PASSWORD',
    'NEST_DATABASE_NAME',
    'NEST_DATABASE_LOGGING',
    'NEST_DATABASE_SYNCHRONIZE',
    'NEST_STATIC_ASSETS_MAXAGE',
    'NEST_CORS_ORIGINS',
    'NEST_LOG_LEVEL',
    'NEST_STATIC_ASSETS_DIR',
    'NEST_STATIC_ASSETS_PREFIX',
    'NEST_UPLOAD_PATH',
    'NEST_UPLOAD_PREFIX',
    'NEST_UPLOAD_MAX_SIZE',
    'NEST_UPLOAD_ALLOWED_TYPES',
    'NEST_UPLOAD_MAX_FILES',
    'NEST_REDIS_ENABLED',
    'NEST_REDIS_HOST',
    'NEST_REDIS_PORT',
    'NEST_REDIS_PASSWORD',
    'NEST_REDIS_DB',
    'NEST_REDIS_CONNECT_TIMEOUT',
    'NEST_REDIS_COMMAND_TIMEOUT',
    'NEST_REDIS_RETRIES',
    'NEST_REDIS_RETRY_DELAY',
    'NEST_REDIS_MAX_CONNECTIONS',
    'NEST_REDIS_MIN_CONNECTIONS',
    'NEST_REDIS_IDLE_TIMEOUT',
    'NEST_REDIS_KEY_PREFIX',
    'NEST_REDIS_DEFAULT_TTL',
  ];
  const prodRequired = [
    'NODE_ENV',
    'NEST_PORT',
    'NEST_BASE_URL',
    'NEST_JWT_SECRET',
    'NEST_DATABASE_HOST',
    'NEST_DATABASE_PORT',
    'NEST_DATABASE_USER',
    'NEST_DATABASE_PASSWORD',
    'NEST_DATABASE_NAME',
    'NEST_DATABASE_LOGGING',
    'NEST_DATABASE_SYNCHRONIZE',
    'NEST_CORS_ORIGINS',
    'NEST_LOG_LEVEL',
    'NEST_STATIC_ASSETS_DIR',
    'NEST_STATIC_ASSETS_PREFIX',
    'NEST_STATIC_ASSETS_MAXAGE',
    'NEST_UPLOAD_PATH',
    'NEST_UPLOAD_MAX_SIZE',
    'NEST_UPLOAD_ALLOWED_TYPES',
    'NEST_REDIS_ENABLED',
    'NEST_REDIS_HOST',
    'NEST_REDIS_PORT',
    'NEST_REDIS_PASSWORD',
    'NEST_REDIS_DB',
    'NEST_REDIS_CONNECT_TIMEOUT',
    'NEST_REDIS_COMMAND_TIMEOUT',
    'NEST_REDIS_RETRIES',
    'NEST_REDIS_RETRY_DELAY',
    'NEST_REDIS_MAX_CONNECTIONS',
    'NEST_REDIS_MIN_CONNECTIONS',
    'NEST_REDIS_IDLE_TIMEOUT',
    'NEST_REDIS_KEY_PREFIX',
    'NEST_REDIS_DEFAULT_TTL',
  ];
  const testRequired = [
    'NODE_ENV',
    'NEST_PORT',
    'NEST_BASE_URL',
    'NEST_JWT_SECRET',
    'NEST_CORS_ORIGINS',
    'NEST_DATABASE_HOST',
    'NEST_DATABASE_PORT',
    'NEST_DATABASE_USER',
    'NEST_DATABASE_PASSWORD',
    'NEST_DATABASE_NAME',
    'NEST_DATABASE_LOGGING',
    'NEST_DATABASE_SYNCHRONIZE',
    'NEST_STATIC_ASSETS_MAXAGE',
    'NEST_STATIC_ASSETS_DIR',
    'NEST_STATIC_ASSETS_PREFIX',
    'NEST_UPLOAD_PATH',
    'NEST_UPLOAD_PREFIX',
    'NEST_UPLOAD_MAX_SIZE',
    'NEST_UPLOAD_ALLOWED_TYPES',
    'NEST_UPLOAD_MAX_FILES',
    'NEST_REDIS_ENABLED',
    'NEST_REDIS_HOST',
    'NEST_REDIS_PORT',
    'NEST_REDIS_PASSWORD',
    'NEST_REDIS_DB',
    'NEST_REDIS_CONNECT_TIMEOUT',
    'NEST_REDIS_COMMAND_TIMEOUT',
    'NEST_REDIS_RETRIES',
    'NEST_REDIS_RETRY_DELAY',
    'NEST_REDIS_MAX_CONNECTIONS',
    'NEST_REDIS_MIN_CONNECTIONS',
    'NEST_REDIS_IDLE_TIMEOUT',
    'NEST_REDIS_KEY_PREFIX',
    'NEST_REDIS_DEFAULT_TTL',
  ];

  function checkGroup(envName, requiredList) {
    const vars = envData[envName] || {};
    log(`\n📋 必需变量检查 (${envName}):`, 'check');
    requiredList.forEach((varName) => {
      const exists = varName in vars;
      const status = exists ? '✅' : '❌';
      const type = exists ? 'success' : 'error';
      const value = exists
        ? varName.includes('PASSWORD') || varName.includes('SECRET')
          ? '***'
          : vars[varName]
        : '未设置';
      log(`  ${status} ${varName}: ${value}`, type);
      if (!exists) allFilesOk = false;
    });
  }

  checkGroup('.env', commonRequired);
  checkGroup('.env.development', devRequired);
  checkGroup('.env.production', prodRequired);
  checkGroup('.env.test', testRequired);

  // 检查变量一致性
  if (envData['.env'] && envData['.env.development']) {
    log('\n🔄 变量冲突检查:', 'warning');
    const commonEnv = envData['.env'];
    const devEnv = envData['.env.development'];

    Object.keys(commonEnv).forEach((key) => {
      if (key in devEnv) {
        log(`  ⚠️  ${key} 在 .env 和 .env.development 中都存在`, 'yellow');
      }
    });
  }

  // 检查端口配置
  if (envData['.env.development']?.NEST_PORT) {
    log('\n🌐 端口配置:', 'check');
    log(`  📍 开发端口: ${envData['.env.development'].NEST_PORT}`, 'success');
    if (envData['.env.production']?.NEST_PORT)
      log(`  📍 生产端口: ${envData['.env.production'].NEST_PORT}`, 'success');
    if (envData['.env.test']?.NEST_PORT)
      log(`  📍 测试端口: ${envData['.env.test'].NEST_PORT}`, 'success');
  }

  // 总结
  separator('─', 50);
  if (allFilesOk) {
    showSuccess('🎉 环境配置检查通过！');
  } else {
    log('❌ 环境配置存在问题，请检查上述错误', 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    handleError('环境检查脚本执行失败', err);
  }
}

module.exports = { checkFileExists, loadEnvFile };
