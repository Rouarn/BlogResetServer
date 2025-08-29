# 删除测试文件脚本

本目录包含用于删除项目中所有 `.spec.ts` 测试文件的脚本。

## 可用脚本

### 1. Node.js 脚本 (推荐)
```bash
node scripts/remove-spec-files.js
```
- 自动删除所有 `.spec.ts` 文件
- 显示删除进度
- 跨平台兼容

### 2. PowerShell 脚本
```powershell
powershell -ExecutionPolicy Bypass -File scripts/remove-spec-files.ps1
```
- 交互式确认删除
- 显示详细的文件列表
- 适用于 Windows PowerShell

### 3. 批处理脚本
```cmd
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