@echo off
setlocal enabledelayedexpansion

echo 开始搜索并删除所有 .spec.ts 文件...
echo.

set "count=0"
set "deleted=0"

:: 搜索所有 .spec.ts 文件
for /r "%~dp0.." %%f in (*.spec.ts) do (
    set /a count+=1
    echo 找到: %%f
)

if !count! equ 0 (
    echo 未找到任何 .spec.ts 文件
    pause
    exit /b 0
)

echo.
echo 找到 !count! 个 .spec.ts 文件
echo.
set /p confirm="确认删除这些文件吗？(y/N): "

if /i "!confirm!" neq "y" (
    echo 操作已取消
    pause
    exit /b 0
)

echo.
echo 开始删除文件...

:: 删除所有 .spec.ts 文件
for /r "%~dp0.." %%f in (*.spec.ts) do (
    del "%%f" 2>nul
    if not exist "%%f" (
        echo 已删除: %%f
        set /a deleted+=1
    ) else (
        echo 删除失败: %%f
    )
)

echo.
echo 删除操作完成！
echo 成功删除: !deleted! 个文件

pause