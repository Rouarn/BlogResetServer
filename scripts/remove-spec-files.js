/**
 * 测试文件清理脚本
 * 
 * 功能说明：
 * - 递归删除项目中的所有 .spec.ts 测试文件
 * - 遍历整个项目目录结构（包括子目录）
 * - 提供删除过程的详细日志输出
 * - 包含错误处理，确保脚本稳定运行
 * 
 * 使用场景：
 * - 生产环境部署前清理测试文件
 * - 减少项目体积和构建时间
 * - 清理不需要的测试代码
 * - 项目重构时批量删除测试文件
 * 
 * 使用方法：
 * - 直接运行：node scripts/remove-spec-files.js
 * - npm 脚本：npm run clean:tests
 * - 批处理：scripts/remove-spec-files.bat (Windows)
 * - PowerShell：scripts/remove-spec-files.ps1 (Windows)
 * 
 * 注意事项：
 * - 此操作不可逆，请确保已备份重要的测试文件
 * - 会删除整个项目目录下的所有 .spec.ts 文件
 * - 包括 src、test 等所有目录中的测试文件
 */

const fs = require('fs');
const path = require('path');

/**
 * 递归删除所有 .spec.ts 文件
 * 
 * 遍历指定目录及其所有子目录，查找并删除 .spec.ts 测试文件
 * 包含完善的错误处理机制，确保单个文件删除失败不影响整体流程
 * 
 * @param {string} dir - 要搜索的目录路径
 */
function removeSpecFiles(dir) {
  try {
    // 读取目录中的所有文件和子目录
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // 如果是目录，递归处理子目录
          // 跳过 node_modules 和 .git 等不需要处理的目录
          if (!['node_modules', '.git', 'dist', '.next', '.nuxt'].includes(file)) {
            removeSpecFiles(filePath);
          }
        } else if (file.endsWith('.spec.ts')) {
          // 如果是 .spec.ts 测试文件，删除它
          try {
            fs.unlinkSync(filePath);
            console.log(`✅ 已删除: ${filePath}`);
          } catch (error) {
            console.error(`❌ 删除失败 ${filePath}:`, error.message);
          }
        }
      } catch (error) {
        // 处理单个文件状态检查失败的情况
        console.error(`⚠️  无法访问 ${filePath}:`, error.message);
      }
    });
  } catch (error) {
    // 处理目录读取失败的情况
    console.error(`❌ 读取目录失败 ${dir}:`, error.message);
  }
}

// -----------------------------------------------------------------------------
// 主执行逻辑
// -----------------------------------------------------------------------------

// 获取项目根目录的绝对路径
const projectRoot = path.resolve(__dirname, '..');

console.log('🧹 NestJS 测试文件清理工具');
console.log('='.repeat(50));
console.log(`📁 项目根目录: ${projectRoot}`);
console.log('🔍 开始搜索并删除所有 .spec.ts 文件...');
console.log('');

// 检查项目根目录是否存在
if (!fs.existsSync(projectRoot)) {
  console.error('❌ 项目根目录不存在');
  process.exit(1);
}

// 执行测试文件删除
try {
  removeSpecFiles(projectRoot);
  
  console.log('');
  console.log('🎉 删除操作完成！');
  console.log('💡 提示：');
  console.log('   - 此操作不可逆，如需恢复请从版本控制系统还原');
  console.log('   - 建议在删除前先提交代码到 Git');
  console.log('   - 如需重新生成测试文件，可使用 NestJS CLI');
  
} catch (error) {
  console.error('❌ 执行过程中发生未预期的错误:', error.message);
  process.exit(1);
}