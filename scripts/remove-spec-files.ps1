# PowerShell 脚本：删除所有 .spec.ts 文件

param(
    [string]$RootPath = ".."
)

# 获取项目根目录的绝对路径
$ProjectRoot = Resolve-Path $RootPath

Write-Host "开始从 $ProjectRoot 搜索并删除所有 .spec.ts 文件..." -ForegroundColor Green

# 查找所有 .spec.ts 文件
$SpecFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Filter "*.spec.ts" -File

if ($SpecFiles.Count -eq 0) {
    Write-Host "未找到任何 .spec.ts 文件" -ForegroundColor Yellow
    exit 0
}

Write-Host "找到 $($SpecFiles.Count) 个 .spec.ts 文件:" -ForegroundColor Cyan

# 显示将要删除的文件列表
foreach ($file in $SpecFiles) {
    Write-Host "  - $($file.FullName)" -ForegroundColor Gray
}

# 确认删除
$confirmation = Read-Host "`n确认删除这些文件吗？(y/N)"

if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
    $deletedCount = 0
    $failedCount = 0
    
    foreach ($file in $SpecFiles) {
        try {
            Remove-Item $file.FullName -Force
            Write-Host "已删除: $($file.FullName)" -ForegroundColor Green
            $deletedCount++
        }
        catch {
            Write-Host "删除失败 $($file.FullName): $($_.Exception.Message)" -ForegroundColor Red
            $failedCount++
        }
    }
    
    Write-Host "`n删除操作完成！" -ForegroundColor Green
    Write-Host "成功删除: $deletedCount 个文件" -ForegroundColor Green
    if ($failedCount -gt 0) {
        Write-Host "删除失败: $failedCount 个文件" -ForegroundColor Red
    }
} else {
    Write-Host "操作已取消" -ForegroundColor Yellow
}