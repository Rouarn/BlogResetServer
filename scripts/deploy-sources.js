#!/usr/bin/env node

// @ts-check
// 类型检查由 tsconfig.scripts.json + `pnpm run type:check:scripts` 覆盖。

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * 参与构建指纹的构建配置。
 *
 * 它们不产生编译产物，但会改变产物内容（例如 deleteOutDir、target、别名），
 * 所以改动后同样需要重新 deploy。
 */
const BUILD_INPUT_FILES = ['package.json', 'tsconfig.json', 'tsconfig.build.json', 'nest-cli.json'];

/**
 * 递归收集启用了 TypeScript 的源码文件。
 *
 * 只收 `src` 下的 `.ts`：Nest 默认只编译 TypeScript（nest-cli.json 未配置 assets），
 * 收全部文件会把 .DS_Store 之类的无关变更算进指纹，产生误报。
 *
 * @param {string} root 项目根目录
 * @param {string} directory 当前遍历目录（绝对路径）
 * @param {string[]} output 收集到的相对路径（POSIX 分隔符）
 */
function collectTypeScriptFiles(root, directory, output) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectTypeScriptFiles(root, absolute, output);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.ts')) {
      output.push(path.relative(root, absolute).split(path.sep).join('/'));
    }
  }
}

/**
 * @param {Buffer | string} value 待哈希内容
 * @returns {string} 十六进制摘要
 */
function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * 计算源码构建指纹：逐文件 sha256 + 汇总摘要。
 *
 * 只读源码，不读 dist/deploy：构建产物的时间戳、权限差异不应影响判断，
 * 而源码内容才是决定产物的唯一输入。
 *
 * @param {string} projectRoot 项目根目录
 * @returns {{ digest: string, files: Record<string, string> }}
 */
function fingerprintSources(projectRoot) {
  /** @type {Record<string, string>} */
  const files = {};
  /** @type {string[]} */
  const sourceFiles = [];
  collectTypeScriptFiles(projectRoot, path.join(projectRoot, 'src'), sourceFiles);

  for (const relative of sourceFiles.sort()) {
    files[relative] = sha256(fs.readFileSync(path.join(projectRoot, relative)));
  }
  for (const relative of BUILD_INPUT_FILES) {
    const absolute = path.join(projectRoot, relative);
    if (fs.existsSync(absolute)) files[relative] = sha256(fs.readFileSync(absolute));
  }

  // 排序后再拼接，保证同一份源码在任何机器、任何遍历顺序下得到相同摘要
  const digest = sha256(
    Object.keys(files)
      .sort()
      .map((relative) => `${relative}:${files[relative]}`)
      .join('\n'),
  );

  return { digest, files };
}

module.exports = { BUILD_INPUT_FILES, fingerprintSources };
