#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 环境变量检查工具
 * 用于验证项目环境配置是否正确
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function loadEnvFile(filePath) {
  if (!checkFileExists(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
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
  log('🔍 NestJS 环境配置检查工具', 'cyan');
  log('='.repeat(50), 'blue');
  
  const rootDir = path.resolve(__dirname, '..');
  const envFiles = [
    { name: '.env', path: path.join(rootDir, '.env'), required: false },
    { name: '.env.development', path: path.join(rootDir, '.env.development'), required: true },
    { name: '.env.production', path: path.join(rootDir, '.env.production'), required: false },
    { name: '.env.example', path: path.join(rootDir, '.env.example'), required: true }
  ];
  
  // 检查环境文件存在性
  log('\n📁 环境文件检查:', 'yellow');
  let allFilesOk = true;
  
  envFiles.forEach(file => {
    const exists = checkFileExists(file.path);
    const status = exists ? '✅' : (file.required ? '❌' : '⚠️');
    const color = exists ? 'green' : (file.required ? 'red' : 'yellow');
    
    log(`  ${status} ${file.name}`, color);
    
    if (file.required && !exists) {
      allFilesOk = false;
    }
  });
  
  // 加载并分析环境变量
  log('\n🔧 环境变量分析:', 'yellow');
  
  const envData = {};
  envFiles.forEach(file => {
    const data = loadEnvFile(file.path);
    if (data) {
      envData[file.name] = data;
    }
  });
  
  // 检查必需的环境变量
  const requiredVars = [
    'NEST_DATABASE_HOST',
    'NEST_DATABASE_PORT', 
    'NEST_DATABASE_USER',
    'NEST_DATABASE_PASSWORD',
    'NEST_DATABASE_NAME',
    'NEST_JWT_SECRET',
    'NEST_PORT'
  ];
  
  const developmentEnv = envData['.env.development'] || {};
  
  log('\n📋 必需变量检查 (.env.development):', 'yellow');
  requiredVars.forEach(varName => {
    const exists = varName in developmentEnv;
    const status = exists ? '✅' : '❌';
    const color = exists ? 'green' : 'red';
    const value = exists ? (varName.includes('PASSWORD') || varName.includes('SECRET') ? '***' : developmentEnv[varName]) : '未设置';
    
    log(`  ${status} ${varName}: ${value}`, color);
    
    if (!exists) {
      allFilesOk = false;
    }
  });
  
  // 检查变量一致性
  if (envData['.env'] && envData['.env.development']) {
    log('\n🔄 变量冲突检查:', 'yellow');
    const commonEnv = envData['.env'];
    const devEnv = envData['.env.development'];
    
    Object.keys(commonEnv).forEach(key => {
      if (key in devEnv) {
        log(`  ⚠️  ${key} 在 .env 和 .env.development 中都存在`, 'yellow');
      }
    });
  }
  
  // 检查端口配置
  if (developmentEnv.NEST_PORT) {
    log('\n🌐 端口配置:', 'yellow');
    log(`  📍 开发端口: ${developmentEnv.NEST_PORT}`, 'green');
    
    if (envData['.env.production'] && envData['.env.production'].NEST_PORT) {
      log(`  📍 生产端口: ${envData['.env.production'].NEST_PORT}`, 'green');
    }
  }
  
  // 总结
  log('\n' + '='.repeat(50), 'blue');
  if (allFilesOk) {
    log('🎉 环境配置检查通过！', 'green');
  } else {
    log('❌ 环境配置存在问题，请检查上述错误', 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkFileExists, loadEnvFile };