# 项目脚本工具集

本目录包含用于项目管理和维护的各种脚本工具。

## 可用脚本

### 1. 环境配置脚本

#### 环境检查
```bash
# 使用 npm scripts (推荐)
pnpm run env:check
# 或直接运行
node scripts/check-env.js
```
- 检查环境配置文件的存在性和完整性
- 验证必需环境变量是否正确设置
- 分析环境变量冲突和一致性问题

#### 环境设置
```bash
# 使用 npm scripts (推荐)
pnpm run env:setup
# 或直接运行
node scripts/setup-env.js
```
- 交互式创建和配置环境文件
- 自动生成随机密钥
- 支持开发和生产环境配置

### 2. 测试文件清理脚本

#### Node.js 脚本 (推荐)
```bash
# 使用 npm scripts (推荐)
pnpm run clean:tests
# 或直接运行
node scripts/remove-spec-files.js
```
- 自动删除所有 `.spec.ts` 文件
- 显示删除进度
- 跨平台兼容

#### PowerShell 脚本
```bash
# 使用 npm scripts
pnpm run clean:tests:ps
# 或直接运行
powershell -ExecutionPolicy Bypass -File scripts/remove-spec-files.ps1
```
- 交互式确认删除
- 显示详细的文件列表
- 适用于 Windows PowerShell

#### 批处理脚本
```bash
# 使用 npm scripts
pnpm run clean:tests:win
# 或直接运行
scripts/remove-spec-files.bat
```
- 交互式确认删除
- 适用于 Windows 命令提示符

## 使用说明

1. 在项目根目录执行脚本
2. 脚本会递归搜索所有子目录
3. 找到的 `.spec.ts` 文件会被删除
4. PowerShell 和批处理脚本会要求确认

## 注意事项

- 删除操作不可逆，请谨慎使用
- 建议在删除前备份重要的测试文件
- 脚本只删除 `.spec.ts` 文件，不会删除其他类型的测试文件

## 安全性

所有脚本都限制在项目目录内操作，不会影响系统其他文件。