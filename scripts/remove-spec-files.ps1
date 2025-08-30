<#
.SYNOPSIS
    NestJS 测试文件清理脚本 (PowerShell 版本)

.DESCRIPTION
    递归搜索并删除项目中的所有 .spec.ts 测试文件
    提供交互式确认和详细的操作反馈
    支持自定义搜索路径和完善的错误处理

.PARAMETER RootPath
    指定要搜索的根目录路径，默认为上级目录 ".."

.EXAMPLE
    .
emove-spec-files.ps1
    使用默认路径删除测试文件

.EXAMPLE
    .
emove-spec-files.ps1 -RootPath "C:\MyProject"
    指定特定路径删除测试文件

.NOTES
    文件名: remove-spec-files.ps1
    作者: NestJS Template
    版本: 1.0
    创建日期: 2024
    
    功能特点:
    - 递归搜索整个项目目录
    - 彩色输出，提升用户体验
    - 交互式确认，防止误删除
    - 详细的统计信息和错误处理
    - 支持参数化配置搜索路径
    
    使用场景:
    - Windows PowerShell 环境下的测试文件清理
    - 生产环境部署前的文件清理
    - 批量删除不需要的测试代码
    - 项目重构时的文件整理
    
    注意事项:
    - 此操作不可逆，请确保已备份重要文件
    - 需要 PowerShell 执行权限
    - 建议在删除前提交代码到版本控制系统
#>

# 定义脚本参数
param(
    [Parameter(Mandatory=$false, HelpMessage="指定要搜索的根目录路径")]
    [string]$RootPath = ".."
)

# =============================================================================
# 初始化和配置
# =============================================================================

# 设置错误处理策略
$ErrorActionPreference = "Stop"

try {
    # 获取项目根目录的绝对路径
    $ProjectRoot = Resolve-Path $RootPath -ErrorAction Stop
} catch {
    Write-Host "❌ 错误: 无法解析路径 '$RootPath'" -ForegroundColor Red
    Write-Host "💡 请确保路径存在且可访问" -ForegroundColor Yellow
    exit 1
}

# 显示脚本标题和信息
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " NestJS 测试文件清理工具 (PowerShell 版)" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 搜索路径: $ProjectRoot" -ForegroundColor Green
Write-Host "🎯 目标文件: *.spec.ts" -ForegroundColor Green
Write-Host ""

# =============================================================================
# 文件搜索阶段
# =============================================================================

Write-Host "📁 开始搜索测试文件..." -ForegroundColor Yellow

try {
    # 递归查找所有 .spec.ts 文件
    # -Recurse: 递归搜索子目录
    # -Filter: 文件名过滤器
    # -File: 只返回文件，不包括目录
    $SpecFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Filter "*.spec.ts" -File -ErrorAction Stop
} catch {
    Write-Host "❌ 搜索文件时发生错误: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 检查是否找到任何文件
if ($SpecFiles.Count -eq 0) {
    Write-Host "⚠️  未找到任何 .spec.ts 文件" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 可能的原因:" -ForegroundColor Cyan
    Write-Host "   - 项目中没有测试文件" -ForegroundColor Gray
    Write-Host "   - 测试文件使用了不同的命名规则" -ForegroundColor Gray
    Write-Host "   - 搜索路径不正确" -ForegroundColor Gray
    exit 0
}

# =============================================================================
# 文件列表显示阶段
# =============================================================================

Write-Host "📊 找到 $($SpecFiles.Count) 个 .spec.ts 文件:" -ForegroundColor Cyan
Write-Host ""

# 显示将要删除的文件列表
foreach ($file in $SpecFiles) {
    # 显示相对路径，使输出更简洁
    $relativePath = $file.FullName.Replace($ProjectRoot.Path, ".")
    Write-Host "  📄 $relativePath" -ForegroundColor Gray
}

# =============================================================================
# 用户确认阶段
# =============================================================================

Write-Host ""
Write-Host "⚠️  警告: 此操作不可逆！" -ForegroundColor Red
Write-Host "💡 建议: 删除前请确保已提交代码到版本控制系统" -ForegroundColor Yellow
Write-Host ""

# 获取用户确认
$confirmation = Read-Host "❓ 确认删除这些文件吗？(y/N)"

# 检查用户输入
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host ""
    Write-Host "❌ 操作已取消" -ForegroundColor Yellow
    Write-Host "💡 如需删除，请重新运行脚本并输入 'y' 确认" -ForegroundColor Cyan
    exit 0
}

# =============================================================================
# 文件删除阶段
# =============================================================================

Write-Host ""
Write-Host "🗑️  开始删除文件..." -ForegroundColor Yellow
Write-Host ""

# 初始化计数器
$deletedCount = 0
$failedCount = 0

# 遍历并删除每个文件
foreach ($file in $SpecFiles) {
    try {
        # 强制删除文件（包括只读文件）
        Remove-Item $file.FullName -Force -ErrorAction Stop
        
        # 显示成功信息
        $relativePath = $file.FullName.Replace($ProjectRoot.Path, ".")
        Write-Host "✅ 已删除: $relativePath" -ForegroundColor Green
        $deletedCount++
        
    } catch {
        # 显示失败信息
        $relativePath = $file.FullName.Replace($ProjectRoot.Path, ".")
        Write-Host "❌ 删除失败 $relativePath" -ForegroundColor Red
        Write-Host "   错误详情: $($_.Exception.Message)" -ForegroundColor DarkRed
        $failedCount++
    }
}

# =============================================================================
# 结果统计阶段
# =============================================================================

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "🎉 删除操作完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📊 操作统计:" -ForegroundColor Cyan
Write-Host "   找到文件: $($SpecFiles.Count) 个" -ForegroundColor White
Write-Host "   成功删除: $deletedCount 个" -ForegroundColor Green

if ($failedCount -gt 0) {
    Write-Host "   删除失败: $failedCount 个" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  部分文件删除失败，可能的原因:" -ForegroundColor Yellow
    Write-Host "   - 文件被其他程序占用" -ForegroundColor Gray
    Write-Host "   - 权限不足" -ForegroundColor Gray
    Write-Host "   - 文件为只读属性" -ForegroundColor Gray
}

Write-Host ""
Write-Host "💡 提示:" -ForegroundColor Cyan
Write-Host "   - 如需恢复文件，请从版本控制系统还原" -ForegroundColor Gray
Write-Host "   - 如需重新生成测试文件，可使用 NestJS CLI" -ForegroundColor Gray
Write-Host "   - 建议运行 npm test 验证项目是否正常" -ForegroundColor Gray