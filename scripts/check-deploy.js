#!/usr/bin/env node

// @ts-check
// 开启类型检查：本脚本调用 @vakao/scripts-utils 的 log(message, type)，第二个参数
// 必须是 LogType。由 tsconfig.scripts.json + `pnpm run type:check:scripts` 拦截非法值。

const fs = require('fs');
const path = require('path');
const { log, showBanner, showSuccess, separator, handleError } = require('@vakao/scripts-utils');
const { fingerprintSources } = require('./deploy-sources');

/**
 * 部署包同步校验
 *
 * `deploy/` 整体由 `pnpm run deploy` 重建，容易被忘记重建：改完源码直接上传旧
 * deploy/ 会出现「代码已改、线上仍是旧逻辑」。部署脚本生成 deploy/ 时会写入
 * 源码指纹（deploy-manifest.json），这里重新计算并比对。
 */

const projectRoot = path.resolve(__dirname, '..');
const deployPath = path.join(projectRoot, 'deploy');
const manifestPath = path.join(deployPath, 'deploy-manifest.json');
/** 变更文件过多时只列前几条，避免刷屏 */
const MAX_REPORTED_CHANGES = 10;

/**
 * 汇总两次指纹的差异：新增 / 修改 / 删除。
 *
 * @param {Record<string, string>} previous 构建时记录的指纹
 * @param {Record<string, string>} current 当前源码指纹
 * @returns {string[]} 变更描述
 */
function diffFingerprints(previous, current) {
  const changes = [];
  for (const [file, hash] of Object.entries(current)) {
    if (!(file in previous)) changes.push(`新增 ${file}`);
    else if (previous[file] !== hash) changes.push(`修改 ${file}`);
  }
  for (const file of Object.keys(previous)) {
    if (!(file in current)) changes.push(`删除 ${file}`);
  }
  return changes.sort();
}

try {
  showBanner('deploy 同步校验');
  log('开始校验 deploy/dist 与源码是否同步...', 'check');
  separator('─', 50);

  if (!fs.existsSync(path.join(deployPath, 'dist'))) {
    throw new Error('deploy/dist 不存在，请先运行 pnpm run deploy');
  }
  if (!fs.existsSync(manifestPath)) {
    throw new Error('deploy 缺少构建指纹（deploy-manifest.json），请重新运行 pnpm run deploy');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest || typeof manifest !== 'object' || typeof manifest.files !== 'object') {
    throw new Error('构建指纹格式不正确，请重新运行 pnpm run deploy');
  }

  const current = fingerprintSources(projectRoot);
  const changes = diffFingerprints(manifest.files, current.files);

  if (changes.length > 0) {
    log(`检测到 ${changes.length} 处源码变更（部署包构建于 ${manifest.builtAt}）：`, 'warning');
    for (const change of changes.slice(0, MAX_REPORTED_CHANGES)) {
      log(change, 'info');
    }
    if (changes.length > MAX_REPORTED_CHANGES) {
      log(`…另有 ${changes.length - MAX_REPORTED_CHANGES} 处未列出`, 'info');
    }
    throw new Error('deploy/dist 已过期，请运行 pnpm run deploy 重新生成部署包');
  }

  separator('─', 50);
  showSuccess(`deploy/dist 与源码一致（${Object.keys(current.files).length} 个输入文件）`);
} catch (err) {
  handleError('deploy 同步校验失败', err);
}
